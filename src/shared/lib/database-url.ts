import path from 'node:path'

function normalizeDatabaseUrl(url: string, cwd: string): string {
  if (!url.startsWith('file:')) {
    return url
  }

  const rest = url.slice('file:'.length)

  if (rest.startsWith('//') || rest.startsWith('/')) {
    return url
  }

  const absPath = path.resolve(cwd, rest)
  return `file:${absPath.replace(/\\/g, '/')}`
}

export function getDatabaseUrl(options?: { cwd?: string }): string {
  const cwd = options?.cwd ?? process.cwd()
  const fromEnv = process.env.DATABASE_URL?.trim()

  if (fromEnv) {
    return normalizeDatabaseUrl(fromEnv, cwd)
  }

  return normalizeDatabaseUrl(
    'postgresql://user_sQMkPE:password_FydR5W@8.140.242.230:15432/start-basic?schema=public',
    cwd
  )
}
