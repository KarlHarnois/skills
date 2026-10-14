export const meta = {
  name: 'build-feature',
  description: 'Implement an approved spec, refactor the result, then review and apply fixes until nothing in scope is left',
  phases: [
    { title: 'Implement', detail: 'implementer writes the code and tests for the spec' },
    { title: 'Refactor', detail: 'refactorer improves the changed files without changing behavior' },
    { title: 'Review', detail: 'pr-reviewer reviews the branch against the spec' },
    { title: 'Apply', detail: 'implementer triages the findings and commits the fixes it keeps' },
  ],
}

const DEFAULT_MAX_ROUNDS = 3
const REVIEWER_ATTEMPTS = 2
const REVIEW_COMPLETE_MARKER = 'Review Complete'
const KEPT_DECISIONS = ['implemented', 'reverted']
const DECLINED_DECISIONS = ['pushed_back', 'deferred']

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
          decision: { type: 'string', enum: [...KEPT_DECISIONS, ...DECLINED_DECISIONS, 'repeat'] },
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

const BUILD_STAGES = [
  { name: 'implement', phase: 'Implement', agentType: 'implementer', brief: prompts => prompts.build() },
  { name: 'refactor', phase: 'Refactor', agentType: 'refactorer', brief: prompts => prompts.refactor() },
]

class RunSettings {
  constructor(input) {
    this.requireFields(input, ['specPath', 'branch', 'baseBranch'])
    this.specPath = input.specPath
    this.branch = input.branch
    this.baseBranch = input.baseBranch
    this.verifyCommands = input.verifyCommands ?? []
    this.verificationArtifacts = input.verificationArtifacts ?? []
    this.baseline = input.baseline ?? 'none recorded'
    this.reviewOnly = input.reviewOnly === true
    this.firstRound = input.startRound ?? 1
    this.lastRound = this.firstRound + (input.maxRounds ?? DEFAULT_MAX_ROUNDS) - 1
    this.declined = input.declined ?? []
  }

  requireFields(input, names) {
    const missing = names.filter(name => !input?.[name])
    if (missing.length > 0) throw new Error(`build-feature pipeline args are missing: ${missing.join(', ')}`)
  }
}

class PromptBook {
  constructor(settings) {
    this.settings = settings
  }

  build() {
    return ['MODE: BUILD', this.runContext()].join('\n')
  }

  refactor() {
    return this.runContext()
  }

  review(round, declined) {
    const { branch, baseBranch, specPath } = this.settings
    return [
      `TARGET: branch ${branch} vs ${baseBranch}`,
      `BRANCH: ${branch}, already checked out.`,
      `FOCUS: Read the approved spec at ${specPath} before the diff. ` +
        'Report each acceptance criterion the diff does not meet as a finding, in addition to the normal review.',
      `ROUND: ${round}`,
      'PREVIOUSLY DECLINED:',
      declined.toBrief(),
      'Return the complete `review-pr` output verbatim.',
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
    const { specPath, branch, baseBranch, verifyCommands, verificationArtifacts, baseline } = this.settings
    return [
      `SPEC: ${specPath}`,
      `BRANCH: ${branch}`,
      `BASE: ${baseBranch}`,
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
      .filter(finding => DECLINED_DECISIONS.includes(finding.decision))
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
        agentType: 'pr-reviewer',
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
      agentType: 'implementer',
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
