import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_PATH = 'plugins/instructions'
const SKILL_PATH = `${PLUGIN_PATH}/skills/writing-model-instructions`
const LINTER_RAN = new Set([0, 1])
const ARCHIVE_BUFFER_BYTES = 64 * 1024 * 1024

export class StandardSnapshot {
  static extract({ repository, label, ref, directory }) {
    const commit = execFileSync('git', ['-C', repository, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim()
    const archive = execFileSync('git', ['-C', repository, 'archive', commit, PLUGIN_PATH], {
      maxBuffer: ARCHIVE_BUFFER_BYTES,
    })
    mkdirSync(directory, { recursive: true })
    execFileSync('tar', ['-x', '-C', directory], { input: archive })
    return new StandardSnapshot(label, ref, commit, directory)
  }

  constructor(label, ref, commit, directory) {
    this.label = label
    this.ref = ref
    this.commit = commit
    this.skillDirectory = join(directory, SKILL_PATH)
    this.linterPath = join(this.skillDirectory, 'scripts/lint.sh')
  }

  warmUp() {
    this.countAlerts([join(this.skillDirectory, 'SKILL.md')])
  }

  countAlerts(paths) {
    if (paths.length === 0) return 0
    const run = spawnSync(this.linterPath, paths, { encoding: 'utf8' })
    if (!LINTER_RAN.has(run.status)) {
      throw new Error(`${this.label} linter exited ${run.status}: ${run.stderr.trim()}`)
    }
    return run.stdout.split('\n').filter(Boolean).length
  }

  describe() {
    return `${this.label} (${this.ref} @ ${this.commit})`
  }
}
