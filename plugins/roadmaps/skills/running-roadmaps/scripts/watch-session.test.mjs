import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const WATCHER = new URL('./watch-session.sh', import.meta.url).pathname
const SESSION = 'builder'

class FakeRingleaderHost {
  constructor() {
    this.directory = mkdtempSync(join(tmpdir(), 'watch-session-'))
    this.statesFile = join(this.directory, 'states')
    this.callCountFile = join(this.directory, 'calls')
    this.paneFile = join(this.directory, 'pane')
    writeFileSync(this.callCountFile, '0')
    this.showPane('worker pane')
    this.installStub('ringleader', this.ringleaderStub())
    this.installStub('tmux', `#!/usr/bin/env bash\ncat "${this.paneFile}"\n`)
  }

  installStub(name, source) {
    const path = join(this.directory, name)
    writeFileSync(path, source)
    chmodSync(path, 0o755)
  }

  ringleaderStub() {
    return `#!/usr/bin/env bash
calls=$(( $(cat "${this.callCountFile}") + 1 ))
echo "$calls" >"${this.callCountFile}"
state=$(sed -n "\${calls}p" "${this.statesFile}")
[ -n "$state" ] || state=$(tail -n 1 "${this.statesFile}")
case "$state" in
  fail) exit 1 ;;
  absent) echo '[]' ;;
  *) echo '[{"name":"${SESSION}","state":"'"$state"'"}]' ;;
esac
`
  }

  reportStates(...states) {
    writeFileSync(this.statesFile, states.join('\n') + '\n')
  }

  showPane(text) {
    writeFileSync(this.paneFile, text + '\n')
  }

  listCalls() {
    return Number(readFileSync(this.callCountFile, 'utf8'))
  }

  watch(...args) {
    return spawnSync('bash', [WATCHER, ...args], {
      encoding: 'utf8',
      timeout: 10000,
      env: {
        ...process.env,
        PATH: `${this.directory}:${process.env.PATH}`,
        WATCH_STARTUP_GRACE: '0',
        WATCH_POLL: '0',
      },
    })
  }

  remove() {
    rmSync(this.directory, { recursive: true, force: true })
  }
}

describe('watch-session.sh', () => {
  let host

  beforeEach(() => {
    host = new FakeRingleaderHost()
  })

  afterEach(() => {
    host.remove()
  })

  test('stops with the state when the session is no longer working', () => {
    host.reportStates('waiting')
    const run = host.watch(SESSION)
    assert.equal(run.status, 0)
    assert.equal(run.stdout.split('\n')[0], `${SESSION}: waiting`)
  })

  test('keeps polling while the session is working', () => {
    host.reportStates('working', 'working', 'exited')
    const run = host.watch(SESSION)
    assert.equal(run.stdout.split('\n')[0], `${SESSION}: exited`)
    assert.equal(host.listCalls(), 3)
  })

  test('stops on a permission prompt while the session is still working', () => {
    host.reportStates('working')
    host.showPane('△ Permission required ← Access external directory /tmp')
    const run = host.watch(SESSION)
    assert.equal(run.status, 0)
    assert.equal(run.stdout.split('\n')[0], `${SESSION}: permission-prompt`)
    assert.match(run.stdout, /Access external directory/)
  })

  test('prints the pane tail when it stops', () => {
    host.reportStates('waiting')
    host.showPane('Report sent to manager')
    assert.match(host.watch(SESSION).stdout, /Report sent to manager/)
  })

  test('reports a session that no longer exists as gone', () => {
    host.reportStates('absent')
    assert.equal(host.watch(SESSION).stdout.split('\n')[0], `${SESSION}: gone`)
  })

  test('fails after the listing fails three times in a row', () => {
    host.reportStates('fail')
    const run = host.watch(SESSION)
    assert.equal(run.status, 1)
    assert.match(run.stderr, /watch-failed/)
  })

  test('rejects a call without a session name', () => {
    assert.equal(host.watch().status, 2)
  })
})
