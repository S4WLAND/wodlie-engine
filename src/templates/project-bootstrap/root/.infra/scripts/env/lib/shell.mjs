import { spawn } from 'node:child_process'

export function runCommand(command, args, options = {}) {
  const stdio = options.stdio ?? 'inherit'

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio,
    })

    let stdout = ''
    let stderr = ''

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString()
      })
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })
    }

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code })
        return
      }

      const message = stderr.trim() || stdout.trim() || `${command} exited with code ${code}`
      reject(new Error(message))
    })
  })
}
