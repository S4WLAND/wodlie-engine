import fs from 'node:fs/promises'
import path from 'node:path'

const envLinePattern = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/

export function parseEnvContent(content) {
  const entries = {}

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(envLinePattern)

    if (!match) {
      continue
    }

    entries[match[1]] = match[2]
  }

  return entries
}

export function extractEnvKeys(content) {
  return Object.keys(parseEnvContent(content))
}

function replaceLineValue(line, nextValue) {
  const match = line.match(envLinePattern)

  if (!match) {
    return line
  }

  return `${match[1]}=${nextValue}`
}

function applyDefaultOverrides(lines, overrides = {}) {
  if (!overrides) {
    return lines
  }

  return lines.map((line) => {
    const match = line.match(envLinePattern)

    if (!match) {
      return line
    }

    const nextValue = overrides[match[1]]
    if (typeof nextValue === 'undefined') {
      return line
    }

    return replaceLineValue(line, nextValue)
  })
}

export async function ensureFileFromExample({
  examplePath,
  targetPath,
  overrides,
}) {
  const exampleContent = await fs.readFile(examplePath, 'utf8')
  const exampleLines = applyDefaultOverrides(exampleContent.split(/\r?\n/), overrides)

  await fs.mkdir(path.dirname(targetPath), { recursive: true })

  try {
    const currentContent = await fs.readFile(targetPath, 'utf8')
    const currentKeys = new Set(extractEnvKeys(currentContent))
    const additions = exampleLines.filter((line) => {
      const match = line.match(envLinePattern)
      return match ? !currentKeys.has(match[1]) : false
    })

    if (additions.length === 0) {
      return { created: false, updated: false, addedKeys: [] }
    }

    const header = [
      '',
      '# ─────────────────────────────────────────',
      '# Added by .infra/scripts/env sync',
      '# ─────────────────────────────────────────',
      ...additions,
      '',
    ].join('\n')

    await fs.writeFile(targetPath, `${currentContent.trimEnd()}\n${header}`, 'utf8')

    return {
      created: false,
      updated: true,
      addedKeys: additions
        .map((line) => line.match(envLinePattern)?.[1])
        .filter(Boolean),
    }
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error
    }

    await fs.writeFile(targetPath, `${exampleLines.join('\n').trimEnd()}\n`, 'utf8')

    return {
      created: true,
      updated: false,
      addedKeys: extractEnvKeys(exampleLines.join('\n')),
    }
  }
}

export async function ensureExampleSibling({ examplePath, targetPath }) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })

  try {
    await fs.access(targetPath)
    return false
  } catch {
    const exampleContent = await fs.readFile(examplePath, 'utf8')
    await fs.writeFile(targetPath, exampleContent, 'utf8')
    return true
  }
}
