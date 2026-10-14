import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const LAUNCH_ARGS = {
  specPath: '/repo/.git/build-feature/feature-slugify/spec.md',
  branch: 'feature/slugify',
  baseBranch: 'main',
  verifyCommands: ['pytest -q'],
  verificationArtifacts: ['.coverage'],
  baseline: 'all green',
}

const COMPLETE_REVIEW = 'table of findings\nReview Complete\nCritical issues: 0'
const INCOMPLETE_REVIEW = 'The branch looks fine overall.'

class PipelineScript {
  constructor() {
    const source = readFileSync(new URL('./pipeline.js', import.meta.url), 'utf8')
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    this.body = new AsyncFunction('agent', 'log', 'args', source.replace(/^export const meta/m, 'const meta'))
  }

  run(agents, args) {
    return this.body(
      (prompt, options) => agents.respond(prompt, options),
      message => agents.log(message),
      { ...LAUNCH_ARGS, ...args },
    )
  }
}

class ScriptedAgents {
  constructor(replies) {
    this.queues = Object.fromEntries(Object.entries(replies).map(([agentType, queue]) => [agentType, [...queue]]))
    this.calls = []
    this.logs = []
  }

  respond(prompt, options) {
    this.calls.push({ prompt, ...options })
    const queue = this.queues[options.agentType] ?? []
    if (queue.length === 0) throw new Error(`no scripted reply left for ${options.agentType} (${options.label})`)
    return Promise.resolve(queue.shift())
  }

  log(message) {
    this.logs.push(message)
  }

  labels() {
    return this.calls.map(call => call.label)
  }

  promptFor(label) {
    return this.calls.find(call => call.label === label).prompt
  }
}

class Replies {
  static stageDone() {
    return { status: 'done', question: '', commits: [], verification: [], notes: '' }
  }

  static blocked(question) {
    return { ...Replies.stageDone(), status: 'blocked', question }
  }

  static triage(...decisions) {
    return {
      status: 'done',
      question: '',
      verification: [],
      findings: decisions.map((decision, index) => Replies.finding(decision, index + 1)),
    }
  }

  static blockedTriage(question) {
    return { ...Replies.triage(), status: 'blocked', question }
  }

  static finding(decision, number) {
    return {
      number,
      severity: 'SUGGEST',
      location: `slug.py:${number}`,
      summary: `finding ${number}`,
      decision,
      reason: `reason ${number}`,
      commit: decision === 'implemented' ? `abc${number}` : '',
    }
  }
}

const pipeline = new PipelineScript()

describe('build-feature pipeline', () => {
  test('runs implement, refactor, architect, then review rounds until a round keeps nothing', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone(), Replies.triage('implemented'), Replies.triage('pushed_back')],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [COMPLETE_REVIEW, COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, {})

    assert.deepEqual(agents.labels(), [
      'implement',
      'refactor',
      'architect',
      'review round 1, attempt 1',
      'apply round 1',
      'review round 2, attempt 1',
      'apply round 2',
    ])
    assert.equal(result.exitReason, 'nothing in scope')
    assert.deepEqual(result.resume, { reviewOnly: true, startRound: 3 })
  })

  test('counts a reverted finding as kept, so the loop continues', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone(), Replies.triage('reverted'), Replies.triage()],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [COMPLETE_REVIEW, COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, {})

    assert.equal(result.rounds.length, 2)
    assert.equal(result.exitReason, 'nothing in scope')
  })

  test('stops at the round cap when every round keeps a finding', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone(), Replies.triage('implemented')],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, { maxRounds: 1 })

    assert.equal(result.exitReason, 'round cap')
    assert.deepEqual(result.resume, { reviewOnly: true, startRound: 2 })
  })

  test('halts before refactoring when the implementer is blocked', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.blocked('Which separator should slugify use?')],
    })

    const result = await pipeline.run(agents, {})

    assert.deepEqual(agents.labels(), ['implement'])
    assert.equal(result.exitReason, 'blocked')
    assert.equal(result.stages.implement.question, 'Which separator should slugify use?')
    assert.deepEqual(result.resume, { reviewOnly: false, startRound: 1 })
  })

  test('halts before the architect when the refactorer returns nothing', async () => {
    const agents = new ScriptedAgents({ implementer: [Replies.stageDone()], refactorer: [null] })

    const result = await pipeline.run(agents, {})

    assert.deepEqual(agents.labels(), ['implement', 'refactor'])
    assert.equal(result.exitReason, 'agent failed')
    assert.deepEqual(result.resume, { reviewOnly: false, startRound: 1 })
  })

  test('halts before review when the architect is blocked', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone()],
      refactorer: [Replies.stageDone()],
      architect: [Replies.blocked('Should the slug rules move out of the HTTP handler?')],
    })

    const result = await pipeline.run(agents, {})

    assert.deepEqual(agents.labels(), ['implement', 'refactor', 'architect'])
    assert.equal(result.exitReason, 'blocked')
    assert.equal(result.stages.architect.question, 'Should the slug rules move out of the HTTP handler?')
    assert.deepEqual(result.resume, { reviewOnly: false, startRound: 1 })
  })

  test('retries the reviewer once after an incomplete review', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone(), Replies.triage()],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [INCOMPLETE_REVIEW, COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, {})

    assert.equal(result.exitReason, 'nothing in scope')
    assert.equal(result.rounds[0].review, COMPLETE_REVIEW)
    assert.equal(agents.logs.length, 1)
  })

  test('reports reviewer failed after two incomplete reviews', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone()],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [INCOMPLETE_REVIEW, null],
    })

    const result = await pipeline.run(agents, {})

    assert.equal(result.exitReason, 'reviewer failed')
    assert.deepEqual(result.rounds, [])
    assert.deepEqual(result.resume, { reviewOnly: true, startRound: 1 })
  })

  test('resumes a review-only run at its start round without rebuilding', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.triage()],
      'reviewer': [COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, { reviewOnly: true, startRound: 3 })

    assert.deepEqual(agents.labels(), ['review round 3, attempt 1', 'apply round 3'])
    assert.equal(result.exitReason, 'nothing in scope')
  })

  test('points the resume at a round whose apply pass was blocked', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.blockedTriage('Uncommitted change in notes.txt: keep or discard?')],
      'reviewer': [COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, { reviewOnly: true, startRound: 2 })

    assert.equal(result.exitReason, 'blocked')
    assert.deepEqual(result.resume, { reviewOnly: true, startRound: 2 })
  })

  test('points the resume at a round whose apply agent returned nothing', async () => {
    const agents = new ScriptedAgents({
      implementer: [Replies.stageDone(), null],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, {})

    assert.equal(result.exitReason, 'agent failed')
    assert.deepEqual(result.resume, { reviewOnly: true, startRound: 1 })
  })

  test('carries pushed back and deferred findings into later reviews, but not repeats', async () => {
    const agents = new ScriptedAgents({
      implementer: [
        Replies.stageDone(),
        Replies.triage('implemented', 'pushed_back'),
        Replies.triage('repeat', 'implemented', 'deferred'),
        Replies.triage(),
      ],
      refactorer: [Replies.stageDone()],
      architect: [Replies.stageDone()],
      'reviewer': [COMPLETE_REVIEW, COMPLETE_REVIEW, COMPLETE_REVIEW],
    })

    const result = await pipeline.run(agents, {})

    assert.deepEqual(result.declined.map(entry => entry.location), ['slug.py:2', 'slug.py:3'])
    assert.match(agents.promptFor('review round 2, attempt 1'), /slug\.py:2[\s\S]*reason 2/)
    assert.match(agents.promptFor('review round 3, attempt 1'), /slug\.py:3[\s\S]*reason 3/)
  })

  test('passes declined findings from a previous run into the first review', async () => {
    const declined = [{ severity: 'NITPICK', location: 'slug.py:9', summary: 'sort imports', reason: 'isort runs in CI' }]
    const agents = new ScriptedAgents({ implementer: [Replies.triage()], 'reviewer': [COMPLETE_REVIEW] })

    const result = await pipeline.run(agents, { reviewOnly: true, startRound: 2, declined })

    assert.match(agents.promptFor('review round 2, attempt 1'), /slug\.py:9[\s\S]*isort runs in CI/)
    assert.deepEqual(result.declined, declined)
  })

  test('rejects launch args missing the spec path, branch, or base branch', async () => {
    const agents = new ScriptedAgents({})

    await assert.rejects(
      pipeline.run(agents, { specPath: '', baseBranch: undefined }),
      /args are missing: specPath, baseBranch/,
    )
  })
})
