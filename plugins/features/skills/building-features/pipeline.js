export const meta = {
  name: 'building-features',
  description: 'Implement an approved spec, refactor it, fix its architecture, then review and apply fixes until nothing in scope is left',
  phases: [
    { title: 'Implement', detail: 'implementer writes the code and tests for the spec' },
    { title: 'Refactor', detail: 'refactorer improves the changed files without changing behavior' },
    { title: 'Architect', detail: 'architect fixes module boundaries and dependency direction without changing behavior' },
    { title: 'Review', detail: 'reviewer reviews the branch against the spec' },
    { title: 'Apply', detail: 'implementer triages the findings and commits the fixes it keeps' },
  ],
}

const DEFAULT_MAX_ROUNDS = 3
const ARG_TYPE_CHECKS = {
  startRound: Number.isInteger,
  maxRounds: Number.isInteger,
  reviewOnly: value => typeof value === 'boolean',
  verifyCommands: Array.isArray,
  verificationArtifacts: Array.isArray,
  declined: Array.isArray,
}
const REVIEWER_ATTEMPTS = 2
const REVIEW_COMPLETE_MARKER = 'Review Complete'
const DECISIONS = ['implemented', 'reverted', 'pushed_back', 'deferred', 'repeat']
const KEPT_DECISIONS = ['implemented', 'reverted']
const NOT_IMPLEMENTED_DECISIONS = ['reverted', 'pushed_back', 'deferred']

const EXIT_REASONS = {
  nothingInScope: 'nothing in scope',
  roundCap: 'round cap',
  blocked: 'blocked',
  reviewerFailed: 'reviewer failed',
  agentFailed: 'agent failed',
}

const VERIFICATION_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      result: { type: 'string', description: 'pass, or the failures the baseline does not show' },
    },
    required: ['command', 'result'],
  },
}

const STATUS_PROPERTIES = {
  status: { type: 'string', enum: ['done', 'blocked'] },
  question: { type: 'string', description: 'The one question for the user when status is blocked; empty otherwise' },
}

const STAGE_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    ...STATUS_PROPERTIES,
    commits: {
      type: 'array',
      items: {
        type: 'object',
        properties: { sha: { type: 'string' }, subject: { type: 'string' } },
        required: ['sha', 'subject'],
      },
    },
    verification: VERIFICATION_SCHEMA,
    notes: { type: 'string' },
  },
  required: ['status', 'question', 'commits', 'verification', 'notes'],
}

const TRIAGE_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    ...STATUS_PROPERTIES,
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          severity: { type: 'string', enum: ['CRITICAL', 'SUGGEST', 'NITPICK'] },
          location: { type: 'string' },
          summary: { type: 'string' },
          decision: { type: 'string', enum: DECISIONS },
          reason: { type: 'string' },
          commit: { type: 'string', description: 'The commit sha when decision is implemented; empty otherwise' },
        },
        required: ['number', 'severity', 'location', 'summary', 'decision', 'reason', 'commit'],
      },
    },
    verification: VERIFICATION_SCHEMA,
  },
  required: ['status', 'question', 'findings', 'verification'],
}

const AGENT_TYPES = {
  implementer: 'features:implementer',
  refactorer: 'features:refactorer',
  architect: 'features:architect',
  reviewer: 'prs:reviewer',
}

const BUILD_STAGES = [
  { name: 'implement', phase: 'Implement', agentType: AGENT_TYPES.implementer, brief: prompts => prompts.build() },
  { name: 'refactor', phase: 'Refactor', agentType: AGENT_TYPES.refactorer, brief: prompts => prompts.runContext() },
  { name: 'architect', phase: 'Architect', agentType: AGENT_TYPES.architect, brief: prompts => prompts.runContext() },
]

class RunSettings {
  constructor(input) {
    this.requireFields(input, ['repoPath', 'specPath', 'branch', 'baseBranch', 'startCommit'])
    this.requireTypes(input)
    this.repoPath = input.repoPath
    this.specPath = input.specPath
    this.branch = input.branch
    this.baseBranch = input.baseBranch
    this.startCommit = input.startCommit
    this.verifyCommands = input.verifyCommands ?? []
    this.verificationArtifacts = input.verificationArtifacts ?? []
    this.baseline = input.baseline ?? 'none recorded'
    this.reviewOnly = input.reviewOnly === true
    this.firstRound = input.startRound ?? 1
    this.lastRound = this.firstRound + (input.maxRounds ?? DEFAULT_MAX_ROUNDS) - 1
    this.declined = input.declined ?? []
  }

  requireTypes(input) {
    const invalid = Object.entries(ARG_TYPE_CHECKS)
      .filter(([name, hasValidType]) => input[name] !== undefined && !hasValidType(input[name]))
      .map(([name]) => name)
    if (invalid.length > 0) throw new Error(`building-features pipeline args have the wrong type: ${invalid.join(', ')}`)
  }

  requireFields(input, names) {
    const missing = names.filter(name => !input?.[name])
    if (missing.length > 0) throw new Error(`building-features pipeline args are missing: ${missing.join(', ')}`)
  }
}

class PromptBook {
  constructor(settings) {
    this.settings = settings
  }

  build() {
    return ['MODE: BUILD', this.runContext()].join('\n')
  }

  review(round, declined) {
    const { repoPath, branch, baseBranch, specPath } = this.settings
    return [
      `REPO: ${repoPath}`,
      `BRANCH: ${branch}`,
      `BASE: ${baseBranch}`,
      `FOCUS: Read the approved spec at ${specPath} before the diff. ` +
        'Report each acceptance criterion the diff does not meet as a finding, in addition to the normal review.',
      `ROUND: ${round}`,
      'PREVIOUSLY DECLINED:',
      declined.toBrief(),
    ].join('\n')
  }

  apply(round, review, declined) {
    return [
      'MODE: APPLY',
      this.runContext(),
      `ROUND: ${round}`,
      'PREVIOUSLY DECLINED:',
      declined.toBrief(),
      'REVIEW:',
      review,
    ].join('\n')
  }

  runContext() {
    const { repoPath, specPath, branch, baseBranch, startCommit, verifyCommands, verificationArtifacts, baseline } = this.settings
    return [
      `REPO: ${repoPath}`,
      `SPEC: ${specPath}`,
      `BRANCH: ${branch}`,
      `BASE: ${baseBranch}`,
      `START: ${startCommit}`,
      'VERIFICATION COMMANDS:',
      this.bulletList(verifyCommands, 'none detected'),
      'VERIFICATION ARTIFACTS:',
      this.bulletList(verificationArtifacts, 'none'),
      `BASELINE: ${baseline}`,
    ].join('\n')
  }

  bulletList(items, emptyText) {
    if (items.length === 0) return `- ${emptyText}`
    return items.map(item => `- ${item}`).join('\n')
  }
}

class DeclinedFindings {
  constructor(entries) {
    this.entries = [...entries]
  }

  recordFrom(findings) {
    findings
      .filter(finding => NOT_IMPLEMENTED_DECISIONS.includes(finding.decision))
      .forEach(finding => this.entries.push(this.entryFor(finding)))
  }

  toBrief() {
    if (this.entries.length === 0) return '- none'
    return this.entries.map(entry => this.briefLine(entry)).join('\n')
  }

  entryFor({ severity, location, summary, reason }) {
    return { severity, location, summary, reason }
  }

  briefLine({ severity, location, summary, reason }) {
    return `- ${severity} ${location} ${summary}\n  Reason: ${reason}`
  }
}

class AgentReport {
  constructor(result) {
    this.result = result
  }

  isDone() {
    return this.result !== null && this.result.status === 'done'
  }

  haltReason() {
    if (this.result === null) return EXIT_REASONS.agentFailed
    if (this.result.status === 'blocked') return EXIT_REASONS.blocked
    return null
  }
}

class ReviewLoop {
  constructor(settings, prompts, declined) {
    this.settings = settings
    this.prompts = prompts
    this.declined = declined
    this.rounds = []
  }

  async run() {
    for (let round = this.settings.firstRound; round <= this.settings.lastRound; round++) {
      const exitReason = await this.runRound(round)
      if (exitReason) return exitReason
    }
    return EXIT_REASONS.roundCap
  }

  nextRound() {
    const lastRound = this.rounds.at(-1)
    if (lastRound === undefined) return this.settings.firstRound
    if (new AgentReport(lastRound.triage).isDone()) return lastRound.round + 1
    return lastRound.round
  }

  async runRound(round) {
    const review = await this.requestReview(round)
    if (review === null) return EXIT_REASONS.reviewerFailed
    const triage = await this.applyReview(round, review)
    this.record(round, review, triage)
    return this.exitReasonAfter(triage)
  }

  async requestReview(round) {
    for (let attempt = 1; attempt <= REVIEWER_ATTEMPTS; attempt++) {
      const review = await agent(this.prompts.review(round, this.declined), {
        label: `review round ${round}, attempt ${attempt}`,
        phase: 'Review',
        agentType: AGENT_TYPES.reviewer,
      })
      if (this.isCompleteReview(review)) return review
      log(`Round ${round}: reviewer attempt ${attempt} did not return a complete review`)
    }
    return null
  }

  isCompleteReview(review) {
    return typeof review === 'string' && review.includes(REVIEW_COMPLETE_MARKER)
  }

  applyReview(round, review) {
    return agent(this.prompts.apply(round, review, this.declined), {
      label: `apply round ${round}`,
      phase: 'Apply',
      agentType: AGENT_TYPES.implementer,
      schema: TRIAGE_RESULT_SCHEMA,
    })
  }

  record(round, review, triage) {
    this.rounds.push({ round, review, triage })
    if (new AgentReport(triage).isDone()) this.declined.recordFrom(triage.findings)
  }

  exitReasonAfter(triage) {
    const haltReason = new AgentReport(triage).haltReason()
    if (haltReason) return haltReason
    if (!this.keptAny(triage.findings)) return EXIT_REASONS.nothingInScope
    return null
  }

  keptAny(findings) {
    return findings.some(finding => KEPT_DECISIONS.includes(finding.decision))
  }
}

class Pipeline {
  constructor(settings) {
    this.settings = settings
    this.prompts = new PromptBook(settings)
    this.declined = new DeclinedFindings(settings.declined)
    this.reviewLoop = new ReviewLoop(settings, this.prompts, this.declined)
    this.stageResults = {}
  }

  async run() {
    const exitReason = await this.runUntilExit()
    return this.summary(exitReason)
  }

  async runUntilExit() {
    const haltReason = await this.runBuildStages()
    if (haltReason) return haltReason
    return this.reviewLoop.run()
  }

  async runBuildStages() {
    if (this.settings.reviewOnly) return null
    for (const stage of BUILD_STAGES) {
      const haltReason = await this.runStage(stage)
      if (haltReason) return haltReason
    }
    return null
  }

  async runStage(stage) {
    const result = await agent(stage.brief(this.prompts), {
      label: stage.name,
      phase: stage.phase,
      agentType: stage.agentType,
      schema: STAGE_RESULT_SCHEMA,
    })
    this.stageResults[stage.name] = result
    return new AgentReport(result).haltReason()
  }

  summary(exitReason) {
    return {
      exitReason,
      stages: this.stageResults,
      rounds: this.reviewLoop.rounds,
      declined: this.declined.entries,
      resume: { reviewOnly: this.buildStagesDone(), startRound: this.reviewLoop.nextRound() },
    }
  }

  buildStagesDone() {
    if (this.settings.reviewOnly) return true
    return BUILD_STAGES.every(stage => new AgentReport(this.stageResults[stage.name] ?? null).isDone())
  }
}

return await new Pipeline(new RunSettings(args)).run()
