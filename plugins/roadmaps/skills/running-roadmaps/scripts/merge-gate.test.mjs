import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MERGE_GATE = new URL('./merge-gate.sh', import.meta.url).pathname
const BRANCH = 'add-greeting'
const COUNT_GATE = '[ "$(wc -l < names.txt | tr -d " ")" = 2 ]'

const GIT_IDENTITY = {
  GIT_AUTHOR_NAME: 'Fixture Author',
  GIT_AUTHOR_EMAIL: 'author@example.com',
  GIT_COMMITTER_NAME: 'Fixture Author',
  GIT_COMMITTER_EMAIL: 'author@example.com',
}

class RepositoryWithRemote {
  constructor() {
    this.directory = mkdtempSync(join(tmpdir(), 'merge-gate-'))
    this.remote = join(this.directory, 'remote.git')
    this.checkout = join(this.directory, 'app')
    this.git(this.directory, 'init', '--quiet', '--bare', '-b', 'main', this.remote)
    this.git(this.directory, 'clone', '--quiet', this.remote, this.checkout)
    this.git(this.checkout, 'switch', '--quiet', '-c', 'main')
    this.commit('names.txt', 'Ana\n', 'Add the first name')
    this.push('main')
  }

  git(directory, ...args) {
    const run = spawnSync('git', args, { cwd: directory, encoding: 'utf8', env: { ...process.env, ...GIT_IDENTITY } })
    if (run.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${run.stderr}`)
    return run.stdout.trim()
  }

  commit(path, contents, message) {
    writeFileSync(join(this.checkout, path), contents)
    this.git(this.checkout, 'add', path)
    this.git(this.checkout, 'commit', '--quiet', '-m', message)
  }

  push(branch) {
    this.git(this.checkout, 'push', '--quiet', '--force', 'origin', branch)
  }

  switchTo(branch) {
    this.git(this.checkout, 'switch', '--quiet', branch)
  }

  startBranch() {
    this.git(this.checkout, 'switch', '--quiet', '-c', BRANCH)
  }

  addSecondNameOnBranch() {
    this.startBranch()
    this.commit('names.txt', 'Ana\nBo\n', 'Add a second name')
    this.push(BRANCH)
    this.switchTo('main')
  }

  moveMainWithFile(path, contents) {
    this.switchTo('main')
    this.commit(path, contents, `Change ${path} on main`)
    this.push('main')
  }

  worktreeCount() {
    return this.git(this.checkout, 'worktree', 'list', '--porcelain').split('\n').filter(line => line.startsWith('worktree ')).length
  }

  isBasedOnMain(branch) {
    return spawnSync('git', ['merge-base', '--is-ancestor', 'origin/main', `origin/${branch}`], { cwd: this.checkout }).status === 0
  }

  runGate(...gateCommands) {
    const gateArguments = gateCommands.flatMap(command => ['--gate', command])
    return this.runMergeGate('--base', 'main', '--branch', BRANCH, ...gateArguments)
  }

  runMergeGate(...args) {
    return spawnSync('bash', [MERGE_GATE, ...args], {
      cwd: this.checkout,
      encoding: 'utf8',
      timeout: 20000,
      env: { ...process.env, ...GIT_IDENTITY },
    })
  }

  runShell(command) {
    return spawnSync('bash', ['-c', command], { cwd: this.checkout, encoding: 'utf8' })
  }

  remove() {
    rmSync(this.directory, { recursive: true, force: true })
  }
}

class Verdict {
  constructor(run) {
    this.run = run
    this.lines = run.stdout.trim().split('\n')
  }

  get status() {
    return this.run.status
  }

  get last() {
    return this.lines.at(-1)
  }

  get pushCommand() {
    return this.lines.find(line => line.trim().startsWith('git push')).trim()
  }
}

describe('merge-gate.sh', () => {
  let repository

  beforeEach(() => {
    repository = new RepositoryWithRemote()
  })

  afterEach(() => {
    repository.remove()
  })

  test('passes a branch based on the base whose gate passes', () => {
    repository.addSecondNameOnBranch()
    const verdict = new Verdict(repository.runGate(COUNT_GATE))
    assert.equal(verdict.status, 0)
    assert.match(verdict.last, /^ready: origin\/add-greeting is based on origin\/main, and the gate passed on tree [0-9a-f]{40}$/)
  })

  test('fails a based branch whose gate fails', () => {
    repository.addSecondNameOnBranch()
    const verdict = new Verdict(repository.runGate('true', 'false'))
    assert.equal(verdict.status, 1)
    assert.match(verdict.last, /^gate-failed: `false` failed on origin\/add-greeting/)
  })

  test('gates the rebased tree of a branch that is not based on the base', () => {
    repository.addSecondNameOnBranch()
    repository.moveMainWithFile('README.md', 'names\n')
    const verdict = new Verdict(repository.runGate(COUNT_GATE, 'test -f README.md'))
    assert.equal(verdict.status, 4)
    assert.match(verdict.last, /^ready-after-rebase: /)
  })

  test('prints a push command that leaves the branch based on the base', () => {
    repository.addSecondNameOnBranch()
    repository.moveMainWithFile('README.md', 'names\n')
    const verdict = new Verdict(repository.runGate(COUNT_GATE))
    assert.equal(repository.runShell(verdict.pushCommand).status, 0)
    repository.git(repository.checkout, 'fetch', '--quiet', 'origin')
    assert.ok(repository.isBasedOnMain(BRANCH))
    assert.equal(repository.runGate(COUNT_GATE).status, 0)
  })

  test('reports a branch that does not rebase cleanly', () => {
    repository.addSecondNameOnBranch()
    repository.moveMainWithFile('names.txt', 'Ana\nCy\n')
    const verdict = new Verdict(repository.runGate(COUNT_GATE))
    assert.equal(verdict.status, 3)
    assert.match(verdict.last, /^conflict: .*names\.txt/)
  })

  test('fails the gate on the rebased tree, not on the branch alone', () => {
    repository.startBranch()
    repository.commit('greeting.sh', 'echo hello\n', 'Add a greeting')
    repository.push(BRANCH)
    repository.moveMainWithFile('names.txt', 'Ana\nBo\nCy\n')
    const verdict = new Verdict(repository.runGate('[ "$(wc -l < names.txt | tr -d " ")" = 1 ]'))
    assert.equal(verdict.status, 1)
    assert.match(verdict.last, /^gate-failed: .* rebased onto origin\/main/)
  })

  test('leaves no scratch worktree behind', () => {
    repository.addSecondNameOnBranch()
    repository.moveMainWithFile('names.txt', 'Ana\nCy\n')
    repository.runGate(COUNT_GATE)
    repository.runGate('false')
    assert.equal(repository.worktreeCount(), 1)
  })

  test('gates the base branch itself', () => {
    const verdict = new Verdict(repository.runMergeGate('--base', 'main', '--branch', 'main', '--gate', 'test -f names.txt'))
    assert.equal(verdict.status, 0)
    assert.match(verdict.last, /^ready: origin\/main is based on origin\/main, and the gate passed on tree [0-9a-f]{40}$/)
  })

  test('reports a branch missing from the remote', () => {
    assert.equal(repository.runGate('true').status, 5)
  })

  test('rejects a call without a gate command', () => {
    assert.equal(repository.runMergeGate('--base', 'main', '--branch', BRANCH).status, 2)
  })
})
