import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

  test('accepts a Never that opens a Prohibition at any force-stating never site', () => {
    assert.equal(stating.judge(Fixture.tree('Never push the archive.')), Verdict.CORRECT)
    assert.equal(stating.judge(Fixture.tree('- **Never push the archive.**')), Verdict.CORRECT)
    assert.equal(stating.judge(Fixture.tree('Keep the cache. Never push the archive.')), Verdict.CORRECT)
  })

  test('rejects a capitalized first letter on every other force-stating word', () => {
    const command = new ForceSiteCheck({ anchor: 'dry run', word: 'always', statesForce: true })
    assert.equal(command.judge(Fixture.tree('Always run the dry run.')), Verdict.WRONG)
    assert.equal(stating.judge(Fixture.tree('You push, Never the job, to the archive.')), Verdict.WRONG)
  })

  test('accepts a force-stating site restated with another capitalized force word', () => {
    assert.equal(stating.judge(Fixture.tree('You MUST leave the archive alone.')), Verdict.CORRECT)
    assert.equal(ordinary.judge(Fixture.tree('Amounts MUST be in cents.')), Verdict.REWORDED)
  })

  test('reports a site whose word was reworded or whose anchor was lost', () => {
    assert.equal(stating.judge(Fixture.tree('Do not push the archive.')), Verdict.REWORDED)
    assert.equal(stating.judge(Fixture.tree('Do not push.')), Verdict.LOST)
  })

  test('ignores an anchor inside a fence', () => {
    assert.equal(stating.judge(Fixture.tree('```\nYou NEVER push the archive.\n```')), Verdict.LOST)
  })
})

describe('PlacementCheck', () => {
  const tree = Fixture.tree('Summarize the queue.\n```sh\nbin/dispatch --worker summary\n```')

  test('expects a template outside a fence and a command inside one', () => {
    assert.equal(PlacementCheck.outsideFence('Summarize the queue').judge(tree), Verdict.CORRECT)
    assert.equal(PlacementCheck.insideFence('bin/dispatch').judge(tree), Verdict.CORRECT)
    assert.equal(PlacementCheck.insideFence('Summarize the queue').judge(tree), Verdict.WRONG)
  })

  test('rejects a template copied to its own file while a fenced copy remains', () => {
    const copied = new MarkdownTree([
      { file: 'summary.md', text: 'Summarize the queue.' },
      { file: 'dispatch.md', text: '```markdown\nSummarize the queue.\n```' },
    ])
    assert.equal(PlacementCheck.outsideFence('Summarize the queue').judge(copied), Verdict.WRONG)
  })
})

describe('bench cases', () => {
  test('the force-words input fails every force-stating site except the capitalized prohibition', () => {
    const { verdicts } = Fixture.case('force-words')
    assert.deepEqual(Object.values(verdicts.forceStating).sort(), [Verdict.CORRECT, Verdict.WRONG, Verdict.WRONG, Verdict.WRONG])
    assert.ok(Object.values(verdicts.ordinarySense).every(verdict => verdict === Verdict.CORRECT))
  })

  test('the prompt-templates input keeps both templates in fences', () => {
    const { verdicts } = Fixture.case('prompt-templates')
    assert.deepEqual(Object.values(verdicts.templates), [Verdict.WRONG, Verdict.WRONG])
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
      failures: [],
    }).markdown()
    assert.match(report, /\| Force-stating words capitalized \| 0\/1 \(1 wrong\) \| 1\/1 \|/)
  })
})
