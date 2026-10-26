import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bench } from './bench.mjs'
import { BenchCase } from './lib/bench-case.mjs'
import { BenchReport } from './lib/bench-report.mjs'
import { BlindPanel } from './lib/blind-panel.mjs'
import { ForceSiteCheck, PlacementCheck, Verdict } from './lib/checks.mjs'
import { MarkdownTree } from './lib/markdown-tree.mjs'
import { PromptTemplate } from './lib/prompt-template.mjs'

const CASES = fileURLToPath(new URL('./cases', import.meta.url))

class Fixture {
  static tree(text) {
    return new MarkdownTree([{ file: 'SKILL.md', text }])
  }

  static case(name) {
    const benchCase = BenchCase.load(join(CASES, name))
    return { benchCase, verdicts: benchCase.measure(MarkdownTree.read(benchCase.inputDirectory)) }
  }
}

describe('MarkdownTree', () => {
  test('marks lines inside a fence, including the fence lines', () => {
    const tree = Fixture.tree('prose\n```sh\nrun it\n```\nafter')
    assert.deepEqual(tree.lines.map(line => line.fenced), [false, true, true, true, false])
  })

  test('keeps a longer fence open across an inner fence with an info string', () => {
    const tree = Fixture.tree('````markdown\n```sh\nrun it\n```\nstill template\n````\nafter')
    assert.deepEqual(tree.lines.map(line => line.fenced), [true, true, true, true, true, true, false])
  })

  test('finds lines by anchor in any case', () => {
    assert.equal(Fixture.tree('Push the Archive Branch.').linesWith('archive branch').length, 1)
  })
})

describe('ForceSiteCheck', () => {
  const stating = new ForceSiteCheck({ anchor: 'archive', word: 'never', statesForce: true })
  const ordinary = new ForceSiteCheck({ anchor: 'cents', word: 'always', statesForce: false })

  test('accepts a force-stating word only in all capitals', () => {
    assert.equal(stating.judge(Fixture.tree('You NEVER push the archive.')), Verdict.CORRECT)
    assert.equal(stating.judge(Fixture.tree('You never push the archive.')), Verdict.WRONG)
  })

  test('accepts an ordinary-sense word only outside all capitals', () => {
    assert.equal(ordinary.judge(Fixture.tree('The API always returns cents.')), Verdict.CORRECT)
    assert.equal(ordinary.judge(Fixture.tree('The API ALWAYS returns cents.')), Verdict.WRONG)
  })

  test('rejects a capitalized first letter on every force-stating word', () => {
    const command = new ForceSiteCheck({ anchor: 'dry run', word: 'always', statesForce: true })
    assert.equal(command.judge(Fixture.tree('Always run the dry run.')), Verdict.WRONG)
    assert.equal(stating.judge(Fixture.tree('Never push the archive.')), Verdict.WRONG)
    assert.equal(stating.judge(Fixture.tree('- **Never push the archive.**')), Verdict.WRONG)
  })

  test('accepts a capitalized first letter on an ordinary-sense word', () => {
    assert.equal(ordinary.judge(Fixture.tree('Always, the API returns cents.')), Verdict.CORRECT)
  })

  test('accepts a force-stating site restated with another capitalized force word', () => {
    assert.equal(stating.judge(Fixture.tree('You MUST leave the archive alone.')), Verdict.CORRECT)
    assert.equal(ordinary.judge(Fixture.tree('Amounts MUST be in cents.')), Verdict.REWORDED)
  })

  test('rejects a force-stating site weakened to SHOULD or MAY', () => {
    assert.equal(stating.judge(Fixture.tree('You SHOULD NOT push the archive.')), Verdict.WRONG)
    assert.equal(stating.judge(Fixture.tree('You MAY skip the archive.')), Verdict.WRONG)
  })

  test('reports a site whose word was reworded or whose anchor was lost', () => {
    assert.equal(stating.judge(Fixture.tree('Do not push the archive.')), Verdict.REWORDED)
    assert.equal(stating.judge(Fixture.tree('Do not push.')), Verdict.LOST)
  })

  test('reads an anchor inside a markdown fence and reports one the linter skips', () => {
    assert.equal(stating.judge(Fixture.tree('```markdown\nYou NEVER push the archive.\n```')), Verdict.CORRECT)
    assert.equal(stating.judge(Fixture.tree('```\nYou NEVER push the archive.\n```')), Verdict.UNREAD)
  })
})

describe('PlacementCheck', () => {
  const tree = Fixture.tree('```markdown\nSummarize the queue.\n```\n```sh\nbin/dispatch --worker summary\n```')

  test('expects the linter to read a template and skip a command', () => {
    assert.equal(PlacementCheck.readByLinter('Summarize the queue').judge(tree), Verdict.CORRECT)
    assert.equal(PlacementCheck.skippedByLinter('bin/dispatch').judge(tree), Verdict.CORRECT)
    assert.equal(PlacementCheck.readByLinter('bin/dispatch').judge(tree), Verdict.WRONG)
  })

  test('rejects a template whose fence the linter skips', () => {
    const unlabeled = Fixture.tree('```\nSummarize the queue.\n```')
    assert.equal(PlacementCheck.readByLinter('Summarize the queue').judge(unlabeled), Verdict.WRONG)
  })

  test('rejects a template that keeps one copy the linter skips', () => {
    const copied = new MarkdownTree([
      { file: 'summary.md', text: 'Summarize the queue.' },
      { file: 'dispatch.md', text: '```\nSummarize the queue.\n```' },
    ])
    assert.equal(PlacementCheck.readByLinter('Summarize the queue').judge(copied), Verdict.WRONG)
  })

  test('skips a code block nested in a markdown fence', () => {
    const nested = Fixture.tree('````markdown\nRun this:\n```sh\nbin/dispatch --worker summary\n```\n````')
    assert.equal(PlacementCheck.skippedByLinter('bin/dispatch').judge(nested), Verdict.CORRECT)
    assert.equal(PlacementCheck.readByLinter('Run this').judge(nested), Verdict.CORRECT)
  })
})

describe('bench cases', () => {
  test('the force-words input fails every force-stating site', () => {
    const { verdicts } = Fixture.case('force-words')
    assert.ok(Object.values(verdicts.forceStating).every(verdict => verdict === Verdict.WRONG))
    assert.ok(Object.values(verdicts.ordinarySense).every(verdict => verdict === Verdict.CORRECT))
  })

  test('the prompt-templates input hides both templates and their force words from the linter', () => {
    const { verdicts } = Fixture.case('prompt-templates')
    assert.deepEqual(Object.values(verdicts.templates), [Verdict.WRONG, Verdict.WRONG])
    assert.ok(Object.values(verdicts.forceStating).every(verdict => verdict === Verdict.UNREAD))
    assert.deepEqual(Object.values(verdicts.fencedControls), [Verdict.CORRECT])
  })
})

describe('BlindPanel', () => {
  const panel = new BlindPanel({
    benchCase: { name: 'force-words' },
    rewrites: [{ id: 'force-words/base-1' }, { id: 'force-words/head-1' }],
    root: '/unused',
  })
  const verdict = label => ({ label, fidelity: 8, usefulness: 8, concision: 8, clarity: 8, invented: 0, wrong: 0, harmful: 0, note: '' })

  test('reads a label written as its directory name', () => {
    const ranks = panel.unmask({ rewrites: [verdict('A/'), verdict('B')], ranking: ['B/', 'A'] }).map(({ rank }) => rank)
    assert.deepEqual(ranks, [2, 1])
  })

  test('refuses a ranking that leaves out a rewrite', () => {
    assert.throws(() => panel.unmask({ rewrites: [verdict('A'), verdict('B')], ranking: ['A'] }), /ranking leaves out B/)
  })

  test('lets the judge read only its own directory', () => {
    assert.deepEqual(panel.visibleOnlyTools(), [
      'Read(/unused/force-words/visible/**)',
      'Glob(/unused/force-words/visible/**)',
      'Grep(/unused/force-words/visible/**)',
    ])
  })

  test('refuses scores that name one rewrite twice', () => {
    const twice = { rewrites: [verdict('A'), verdict('A/'), verdict('B')], ranking: ['A', 'B'] }
    assert.throws(() => panel.unmask(twice), /scores name A more than once/)
  })
})

describe('Bench', () => {
  test('records a rewrite it cannot measure and keeps the others', () => {
    const bench = new Bench({ base: 'master', head: 'HEAD', runs: '1', judges: '1', parallel: '1', out: join(tmpdir(), 'bench-test') })
    const measurable = { id: 'force-words/head-1', measure: () => ({ id: 'force-words/head-1' }) }
    const broken = { id: 'force-words/base-1', measure: () => { throw new Error('base linter exited 2') } }
    const measured = bench.measureAll([broken, measurable], [])
    assert.deepEqual(measured.map(({ rewrite }) => rewrite.id), ['force-words/head-1'])
    assert.deepEqual(bench.failures, ['measure force-words/base-1: base linter exited 2'])
  })
})

describe('PromptTemplate', () => {
  test('fills every placeholder', () => {
    assert.equal(new PromptTemplate('Read {{DIR}}.').fill({ DIR: '/work' }), 'Read /work.')
  })

  test('refuses to leave a placeholder unfilled', () => {
    assert.throws(() => new PromptTemplate('Read {{DIR}}.').fill({}), /no value for \{\{DIR\}\}/)
  })
})

describe('BenchReport', () => {
  test('scores each standard per check group and notes the misses', () => {
    const standard = label => ({ label, describe: () => label })
    const measurement = (label, verdict) => ({
      id: `force-words/${label}-1`, caseName: 'force-words', standard: label, run: 1, costUsd: 0, files: [], words: 10,
      alerts: { base: 1, head: 2 },
      checks: { forceStating: { 'never @ archive': verdict }, ordinarySense: {}, templates: {}, fencedControls: {} },
    })
    const report = new BenchReport({
      standards: [standard('base'), standard('head')],
      measurements: [measurement('base', Verdict.WRONG), measurement('head', Verdict.CORRECT)],
      verdicts: [],
      judgeCostUsd: 1.25,
      failures: [],
    }).markdown()
    assert.match(report, /\| Force-stating words capitalized \| 0\/1 \(1 wrong\) \| 1\/1 \|/)
    assert.match(report, /Judge cost: 1\.25 USD\. Total cost: 1\.25 USD\./)
  })
})
