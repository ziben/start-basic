import { seedBase } from './seeds/base'

export { seedBase }

const scope = (process.env.SEED_SCOPE ?? 'all').toLowerCase()

async function main(): Promise<void> {
  if (scope === 'base' || scope === 'all') {
    await seedBase()
  }

}

main().catch((err) => {
  console.error('Seeding failed', err)
  process.exitCode = 1
})
