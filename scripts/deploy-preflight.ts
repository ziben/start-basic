import 'dotenv/config'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const failures: string[] = []

function requireEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  if (!value) failures.push(`missing ${name}`)
  return value
}

const secret = requireEnv('BETTER_AUTH_SECRET')
requireEnv('DATABASE_URL')
if (secret && secret.length < 32) failures.push('BETTER_AUTH_SECRET must be at least 32 characters')

for (const path of ['dist/client', 'dist/server/server.js']) {
  if (!existsSync(path)) failures.push(`missing build output: ${path}`)
}

const migration =
  process.platform === 'win32'
    ? spawnSync(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', 'pnpm exec prisma migrate status --schema db/prisma/schema.prisma'],
        { encoding: 'utf8', timeout: 120_000 }
      )
    : spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'status', '--schema', 'db/prisma/schema.prisma'], {
        encoding: 'utf8',
        timeout: 120_000,
      })
if (migration.status !== 0 || migration.error) failures.push('database migrations are not ready')

const healthUrl = process.env.DEPLOY_HEALTHCHECK_URL?.trim()
if (healthUrl) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) failures.push(`health check returned HTTP ${response.status}`)
  } catch {
    failures.push('health check unavailable')
  }
}

if (failures.length > 0) {
  console.error(`Deploy preflight failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('Deploy preflight passed: configuration, build output, migrations, and optional health check are ready.')
