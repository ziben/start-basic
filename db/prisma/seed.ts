import { seedBase } from './seeds/base'

export { seedBase }

const scope = (process.env.SEED_SCOPE ?? 'all').toLowerCase()

async function main(): Promise<void> {
  if (!['base', 'all'].includes(scope)) {
    throw new Error(`Unsupported SEED_SCOPE: ${scope}`)
  }

  await seedBase()
}

main().catch((err) => {
  console.error('Seeding failed', err)
  process.exitCode = 1
})
