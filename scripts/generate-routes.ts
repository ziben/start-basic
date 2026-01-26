import { Generator, getConfig } from '@tanstack/router-generator'

async function main() {
  const root = process.cwd()
  const config = getConfig({}, root)

  const generator = new Generator({ root, config })
  await generator.run()
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
