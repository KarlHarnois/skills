import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { BenchCase } from './lib/bench-case.mjs'
import { BenchReport } from './lib/bench-report.mjs'
import { BlindPanel } from './lib/blind-panel.mjs'
import { ClaudeCli, TaskPool } from './lib/claude-cli.mjs'
import { PromptTemplate } from './lib/prompt-template.mjs'
import { Rewrite } from './lib/rewrite.mjs'
import { StandardSnapshot } from './lib/standard-snapshot.mjs'

const BENCH_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const REPOSITORY = resolve(BENCH_DIRECTORY, '../../..')

const OPTIONS = {
  base: { type: 'string', default: 'master' },
  head: { type: 'string', default: 'HEAD' },
  runs: { type: 'string', default: '3' },
  judges: { type: 'string', default: '2' },
  parallel: { type: 'string', default: '4' },
  model: { type: 'string' },
  out: { type: 'string' },
}

class Bench {
  constructor(options) {
    this.refs = { base: options.base, head: options.head }
    this.runs = Number(options.runs)
    this.judges = Number(options.judges)
    this.pool = new TaskPool(Number(options.parallel))
    this.cli = new ClaudeCli({ model: options.model })
    this.root = Bench.outputDirectory(options.out)
    this.cases = BenchCase.loadAll(join(BENCH_DIRECTORY, 'cases'))
    this.rewriteTemplate = PromptTemplate.read(join(BENCH_DIRECTORY, 'prompts/rewrite.md'))
    this.judgeTemplate = PromptTemplate.read(join(BENCH_DIRECTORY, 'prompts/judge.md'))
    this.failures = []
  }

  static outputDirectory(requested) {
    const directory = resolve(requested ?? join(tmpdir(), 'instructions-bench', new Date().toISOString().replace(/[:.]/g, '-')))
    if (/\s/.test(directory)) {
      throw new Error(`output directory ${directory} contains whitespace: a quoted linter path never matches the rewriter's permission rule`)
    }
    return directory
  }

  async run() {
    const standards = this.snapshotStandards()
    const rewrites = await this.performRewrites(standards)
    const measurements = rewrites.map(rewrite => rewrite.measure(standards))
    const verdicts = await this.judge(rewrites)
    return this.writeReport({ standards, measurements, verdicts })
  }

  snapshotStandards() {
    return Object.entries(this.refs).map(([label, ref]) => {
      const standard = StandardSnapshot.extract({ repository: REPOSITORY, label, ref, directory: join(this.root, 'standards', label) })
      standard.warmUp()
      Bench.log(`snapshot ${standard.describe()}`)
      return standard
    })
  }

  async performRewrites(standards) {
    const planned = this.cases.flatMap(benchCase => standards.flatMap(standard =>
      Array.from({ length: this.runs }, (_, index) => new Rewrite({ benchCase, standard, run: index + 1, root: join(this.root, 'rewrites') }))))
    const finished = await this.pool.map(planned, rewrite => this.attempt(`rewrite ${rewrite.id}`, () =>
      rewrite.perform(this.cli, this.rewriteTemplate).then(() => rewrite)))
    return finished.filter(Boolean)
  }

  async judge(rewrites) {
    const panels = this.cases
      .map(benchCase => new BlindPanel({ benchCase, rewrites: rewrites.filter(rewrite => rewrite.benchCase === benchCase), root: join(this.root, 'judging') }))
      .filter(panel => panel.rewriteByLabel.size > 0)
    panels.forEach(panel => panel.prepare())
    const sessions = panels.flatMap(panel => Array.from({ length: this.judges }, (_, index) => ({ panel, judgeNumber: index + 1 })))
    const results = await this.pool.map(sessions, ({ panel, judgeNumber }) => this.attempt(
      `judge ${judgeNumber} of ${panel.benchCase.name}`,
      () => panel.judge(this.cli, this.judgeTemplate, judgeNumber),
    ))
    return results.filter(Boolean).flatMap(result => result.verdicts)
  }

  async attempt(label, task) {
    try {
      const result = await task()
      Bench.log(`done ${label}`)
      return result
    } catch (error) {
      this.failures.push(`${label}: ${error.message}`)
      Bench.log(`failed ${label}: ${error.message}`)
      return null
    }
  }

  writeReport(results) {
    const report = new BenchReport({ ...results, failures: this.failures })
    const reportPath = join(this.root, 'report.md')
    writeFileSync(reportPath, report.markdown())
    writeFileSync(join(this.root, 'results.json'), JSON.stringify({ ...results, standards: results.standards.map(standard => standard.describe()), failures: this.failures }, null, 2))
    return reportPath
  }

  static log(message) {
    process.stderr.write(`bench: ${message}\n`)
  }
}

const { values } = parseArgs({ options: OPTIONS })
const bench = new Bench(values)
mkdirSync(bench.root, { recursive: true })
console.log(await bench.run())
