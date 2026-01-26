import { seedBase } from './seeds/base'
import { seedDemo } from './seeds/demo'

export { seedBase, seedDemo }

const scope = (process.env.SEED_SCOPE ?? 'all').toLowerCase()
const modules = (process.env.SEED_MODULES ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

async function main(): Promise<void> {
  if (scope === 'base' || scope === 'all') {
    await seedBase()
  }

  if (scope === 'module' || scope === 'modules' || scope === 'all') {
    const shouldRunDemo = modules.includes('demo')
    if (shouldRunDemo) {
      await seedDemo()
    }
  }
}

main().catch((err) => {
  console.error('Seeding failed', err)
  process.exitCode = 1
})
