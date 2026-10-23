import { cpSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const JUDGE_TOOLS = ['Read', 'Glob', 'Grep']
const SCORE = { type: 'integer', minimum: 1, maximum: 10 }
const COUNT = { type: 'integer', minimum: 0 }

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    rewrites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          fidelity: SCORE,
          usefulness: SCORE,
          concision: SCORE,
          clarity: SCORE,
          invented: COUNT,
          wrong: COUNT,
          harmful: COUNT,
          note: { type: 'string' },
        },
        required: ['label', 'fidelity', 'usefulness', 'concision', 'clarity', 'invented', 'wrong', 'harmful', 'note'],
      },
    },
    ranking: { type: 'array', items: { type: 'string' } },
  },
  required: ['rewrites', 'ranking'],
}

export class BlindPanel {
  constructor({ benchCase, rewrites, root }) {
    this.benchCase = benchCase
    this.directory = join(root, benchCase.name)
    this.visibleDirectory = join(this.directory, 'visible')
    this.rewriteByLabel = BlindPanel.shuffledLabels(rewrites)
  }

  static shuffledLabels(rewrites) {
    return new Map(BlindPanel.shuffle(rewrites).map((rewrite, index) => [String.fromCharCode(65 + index), rewrite]))
  }

  static shuffle(items) {
    const shuffled = [...items]
    for (let last = shuffled.length - 1; last > 0; last--) {
      const pick = Math.floor(Math.random() * (last + 1))
      ;[shuffled[last], shuffled[pick]] = [shuffled[pick], shuffled[last]]
    }
    return shuffled
  }

  prepare() {
    mkdirSync(this.visibleDirectory, { recursive: true })
    cpSync(this.benchCase.inputDirectory, join(this.visibleDirectory, 'original'), { recursive: true })
    for (const [label, rewrite] of this.rewriteByLabel) {
      cpSync(rewrite.workDirectory, join(this.visibleDirectory, label), { recursive: true })
    }
    const mapping = Object.fromEntries([...this.rewriteByLabel].map(([label, rewrite]) => [label, rewrite.id]))
    writeFileSync(join(this.directory, 'mapping.json'), JSON.stringify(mapping, null, 2))
  }

  async judge(cli, template, judgeNumber) {
    const reply = await cli.run({
      prompt: this.promptFrom(template),
      directory: this.visibleDirectory,
      allowedTools: this.visibleOnlyTools(),
      permissionMode: 'default',
      jsonSchema: VERDICT_SCHEMA,
    })
    writeFileSync(join(this.directory, `judge-${judgeNumber}.json`), JSON.stringify(reply.structured, null, 2))
    return { costUsd: reply.costUsd, verdicts: this.unmask(reply.structured) }
  }

  visibleOnlyTools() {
    return JUDGE_TOOLS.map(tool => `${tool}(${this.visibleDirectory}/**)`)
  }

  promptFrom(template) {
    const labels = [...this.rewriteByLabel.keys()]
    return template.fill({
      COUNT: String(labels.length),
      DIR: this.visibleDirectory,
      LABELS: labels.map(label => `\`${label}/\``).join(', '),
      ROLE: this.benchCase.role,
    })
  }

  unmask({ rewrites, ranking }) {
    const rankedLabels = ranking.map(BlindPanel.bareLabel)
    this.requireEveryLabel(rankedLabels, 'ranking')
    const verdicts = rewrites.map(verdict => ({ ...verdict, label: BlindPanel.bareLabel(verdict.label) }))
    this.requireEveryLabel(verdicts.map(({ label }) => label), 'scores')
    return verdicts
      .filter(({ label }) => this.rewriteByLabel.has(label))
      .map(({ label, fidelity, usefulness, concision, clarity, invented, wrong, harmful, note }) => ({
        id: this.rewriteByLabel.get(label).id,
        total: fidelity + usefulness + concision + clarity,
        scores: { fidelity, usefulness, concision, clarity },
        counts: { invented, wrong, harmful },
        rank: rankedLabels.indexOf(label) + 1,
        note,
      }))
  }

  static bareLabel(label) {
    return label.replace(/[`/\s]/g, '')
  }

  requireEveryLabel(labels, part) {
    const missing = [...this.rewriteByLabel.keys()].filter(label => !labels.includes(label))
    if (missing.length) throw new Error(`judge ${part} leaves out ${missing.join(', ')}`)
    const repeated = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))]
    if (repeated.length) throw new Error(`judge ${part} name ${repeated.join(', ')} more than once`)
  }
}
