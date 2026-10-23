import { spawn } from 'node:child_process'

const RUN_TIMEOUT_MS = 20 * 60 * 1000

export class ClaudeCli {
  constructor({ model }) {
    this.model = model
  }

  run({ prompt, directory, readableDirectories = [], allowedTools, permissionMode, jsonSchema }) {
    const args = [
      '-p',
      '--output-format', 'json',
      '--no-session-persistence',
      '--disable-slash-commands',
      '--permission-mode', permissionMode,
      '--allowedTools', ...allowedTools,
      ...readableDirectories.flatMap(readable => ['--add-dir', readable]),
      ...(this.model ? ['--model', this.model] : []),
      ...(jsonSchema ? ['--json-schema', JSON.stringify(jsonSchema)] : []),
    ]
    return ClaudeCli.spawnWithInput(args, directory, prompt).then(ClaudeCli.parseReply)
  }

  static spawnWithInput(args, directory, input) {
    return new Promise((resolve, reject) => {
      const child = spawn('claude', args, { cwd: directory, timeout: RUN_TIMEOUT_MS })
      const stdout = []
      const stderr = []
      child.stdout.on('data', chunk => stdout.push(chunk))
      child.stderr.on('data', chunk => stderr.push(chunk))
      child.on('error', reject)
      child.on('close', status => {
        const output = Buffer.concat(stdout).toString('utf8')
        if (status === 0) resolve(output)
        else reject(new Error(`claude exited ${status} in ${directory}: ${Buffer.concat(stderr).toString('utf8').trim()}`))
      })
      child.stdin.end(input)
    })
  }

  static parseReply(output) {
    const reply = JSON.parse(output)
    if (reply.is_error) throw new Error(`claude reported an error: ${reply.result}`)
    return {
      text: reply.result,
      structured: reply.structured_output,
      costUsd: reply.total_cost_usd ?? 0,
    }
  }
}

export class TaskPool {
  constructor(size) {
    this.size = size
  }

  async map(items, task) {
    const results = new Array(items.length)
    let next = 0
    const worker = async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await task(items[index])
      }
    }
    await Promise.all(Array.from({ length: Math.min(this.size, items.length) }, worker))
    return results
  }
}
