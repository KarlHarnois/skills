import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MarkdownTree } from './markdown-tree.mjs'

const REWRITE_TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep']

export class Rewrite {
  constructor({ benchCase, standard, run, root }) {
    this.benchCase = benchCase
    this.standard = standard
    this.run = run
    this.id = `${benchCase.name}/${standard.label}-${run}`
    this.workDirectory = join(root, benchCase.name, `${standard.label}-${run}`)
    this.replyPath = `${this.workDirectory}.reply.md`
  }

  async perform(cli, template) {
    mkdirSync(this.workDirectory, { recursive: true })
    this.benchCase.copyInputTo(this.workDirectory)
    const reply = await cli.run({
      prompt: this.promptFrom(template),
      directory: this.workDirectory,
      readableDirectories: [this.standard.skillDirectory],
      allowedTools: [...REWRITE_TOOLS, `Bash(${this.standard.linterPath}:*)`],
      permissionMode: 'acceptEdits',
    })
    writeFileSync(this.replyPath, reply.text)
    this.costUsd = reply.costUsd
  }

  promptFrom(template) {
    return template.fill({
      SKILL_DIR: this.standard.skillDirectory,
      WORK_DIR: this.workDirectory,
      ENTRY: this.benchCase.entry,
      ROLE: this.benchCase.role,
    })
  }

  measure(standards) {
    const tree = MarkdownTree.read(this.workDirectory)
    const absolutePaths = tree.paths().map(path => join(this.workDirectory, path))
    return {
      id: this.id,
      caseName: this.benchCase.name,
      standard: this.standard.label,
      run: this.run,
      costUsd: this.costUsd,
      files: tree.paths(),
      words: tree.wordCount(),
      alerts: Object.fromEntries(standards.map(linter => [linter.label, linter.countAlerts(absolutePaths)])),
      checks: this.benchCase.measure(tree),
    }
  }
}
