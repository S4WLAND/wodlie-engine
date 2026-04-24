import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath)
      continue
    }

    await fs.copyFile(sourcePath, targetPath)
  }
}

async function main() {
  const assets = [
    { source: path.join(rootDir, 'src', 'templates'), target: path.join(rootDir, 'dist', 'templates') },
  ]

  for (const asset of assets) {
    await copyDir(asset.source, asset.target)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
