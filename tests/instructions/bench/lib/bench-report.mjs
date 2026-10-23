import { Verdict } from './checks.mjs'

const GROUP_TITLES = {
  forceStating: 'Force-stating words capitalized',
  ordinarySense: 'Ordinary-sense words left lowercase',
  templates: 'Templates outside fences',
  fencedControls: 'Code kept in fences',
}

export class BenchReport {
  constructor({ standards, measurements, verdicts, failures }) {
    this.standards = standards
    this.tallies = standards.map(standard => new StandardTally(
      measurements.filter(measurement => measurement.standard === standard.label),
      verdicts,
    ))
    this.measurements = measurements
    this.verdicts = verdicts
    this.failures = failures
  }

  markdown() {
    return [
      '# Instruction standard bench',
      this.standards.map(standard => `- ${standard.describe()}`).join('\n'),
      '## Summary',
      this.summaryTable(),
      '## Sites',
      this.siteTable(),
      '## Judge notes',
      this.judgeNotes(),
      ...(this.failures.length ? ['## Failures', this.failures.map(failure => `- ${failure}`).join('\n')] : []),
    ].join('\n\n') + '\n'
  }

  summaryTable() {
    const rows = [
      ['Rewrites', tally => String(tally.measurements.length)],
      ...Object.entries(GROUP_TITLES).map(([group, title]) => [title, tally => tally.groupScore(group)]),
      ...this.standards.map(linter => [`Mean alerts, ${linter.label} linter`, tally => tally.meanAlerts(linter.label)]),
      ['Mean words', tally => tally.meanWords()],
      ['Mean judge total (of 40)', tally => tally.meanJudge(verdict => verdict.total)],
      ['Mean judge rank', tally => tally.meanJudge(verdict => verdict.rank)],
      ['Mean invented, wrong, harmful', tally => tally.meanCounts()],
      ['Rewrite cost (USD)', tally => tally.cost()],
    ]
    return MarkdownTable.render(
      ['Measure', ...this.standards.map(standard => standard.label)],
      rows.map(([title, cell]) => [title, ...this.tallies.map(cell)]),
    )
  }

  siteTable() {
    const sites = this.siteKeys()
    return MarkdownTable.render(
      ['Case', 'Check', 'Site', ...this.standards.map(standard => standard.label)],
      sites.map(({ caseName, group, label }) => [
        caseName,
        GROUP_TITLES[group],
        label,
        ...this.tallies.map(tally => tally.siteScore(caseName, group, label)),
      ]),
    )
  }

  siteKeys() {
    const keys = new Map()
    for (const { caseName, checks } of this.measurements) {
      for (const [group, verdicts] of Object.entries(checks)) {
        for (const label of Object.keys(verdicts)) keys.set(`${caseName}|${group}|${label}`, { caseName, group, label })
      }
    }
    return [...keys.values()]
  }

  judgeNotes() {
    return this.measurements
      .map(({ id }) => [id, this.verdicts.filter(verdict => verdict.id === id)])
      .filter(([, verdicts]) => verdicts.length)
      .map(([id, verdicts]) => `- **${id}**: ${verdicts.map(verdict => `(${verdict.total}/40, rank ${verdict.rank}) ${verdict.note}`).join(' ')}`)
      .join('\n')
  }
}

class StandardTally {
  constructor(measurements, verdicts) {
    this.measurements = measurements
    const ids = new Set(measurements.map(measurement => measurement.id))
    this.verdicts = verdicts.filter(verdict => ids.has(verdict.id))
  }

  groupScore(group) {
    return StandardTally.verdictSummary(this.measurements.flatMap(({ checks }) => Object.values(checks[group])))
  }

  siteScore(caseName, group, label) {
    return StandardTally.verdictSummary(this.measurements
      .filter(measurement => measurement.caseName === caseName)
      .map(({ checks }) => checks[group][label]))
  }

  static verdictSummary(verdicts) {
    if (verdicts.length === 0) return 'n/a'
    const count = kind => verdicts.filter(verdict => verdict === kind).length
    const misses = [Verdict.WRONG, Verdict.REWORDED, Verdict.LOST]
      .filter(kind => count(kind) > 0)
      .map(kind => `${count(kind)} ${kind}`)
    const score = `${count(Verdict.CORRECT)}/${verdicts.length}`
    return misses.length ? `${score} (${misses.join(', ')})` : score
  }

  meanAlerts(linterLabel) {
    return StandardTally.mean(this.measurements.map(({ alerts }) => alerts[linterLabel]))
  }

  meanWords() {
    return StandardTally.mean(this.measurements.map(({ words }) => words))
  }

  meanJudge(pick) {
    return StandardTally.mean(this.verdicts.map(pick))
  }

  meanCounts() {
    return ['invented', 'wrong', 'harmful']
      .map(kind => StandardTally.mean(this.verdicts.map(({ counts }) => counts[kind])))
      .join(', ')
  }

  cost() {
    return this.measurements.reduce((total, { costUsd }) => total + (costUsd ?? 0), 0).toFixed(2)
  }

  static mean(values) {
    if (values.length === 0) return 'n/a'
    return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)
  }
}

class MarkdownTable {
  static render(header, rows) {
    return [header, header.map(() => '---'), ...rows].map(cells => `| ${cells.join(' | ')} |`).join('\n')
  }
}
