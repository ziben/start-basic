import fs from 'node:fs/promises'
import path from 'node:path'

async function listPrismaSchemaParts(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listPrismaSchemaParts(abs)))
      continue
    }

    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.prisma.part')) continue
    files.push(abs)
  }

  return files.sort((a, b) => a.localeCompare(b))
}

function countBlocks(source: string, blockType: 'datasource' | 'generator'): number {
  const re = new RegExp(`(^|\\n)\\s*${blockType}\\s+\\w+\\s*\\{`, 'g')
  return [...source.matchAll(re)].length
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(process.cwd())
  const partsDir = path.join(repoRoot, 'db', 'prisma', 'schema')
  const outFile = path.join(repoRoot, 'db', 'prisma', 'schema.prisma')

  const partFiles = await listPrismaSchemaParts(partsDir)
  if (partFiles.length === 0) {
    throw new Error(`No prisma schema parts found in: ${partsDir}`)
  }

  const parts = await Promise.all(
    partFiles.map(async (file) => {
      const content = await fs.readFile(file, 'utf8')
      return { file, content: content.trim() }
    })
  )

  const merged = parts
    .map((p) => p.content)
    .filter(Boolean)
    .join('\n\n')
    .trim()
    .concat('\n')

  const datasourceCount = countBlocks(merged, 'datasource')
  const generatorCount = countBlocks(merged, 'generator')

  if (datasourceCount !== 1) {
    throw new Error(`Expected exactly 1 datasource block, found ${datasourceCount}.`) 
  }

  if (generatorCount !== 1) {
    throw new Error(`Expected exactly 1 generator block, found ${generatorCount}.`) 
  }

  await fs.writeFile(outFile, merged, 'utf8')
  process.stdout.write(`Merged Prisma schema -> ${path.relative(repoRoot, outFile)}\n`)
  process.stdout.write(`Parts:\n${partFiles.map((f) => ` - ${path.relative(repoRoot, f)}`).join('\n')}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
