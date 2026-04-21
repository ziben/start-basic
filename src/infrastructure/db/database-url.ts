import path from 'node:path'

type GetDatabaseUrlOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

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

export function getDatabaseUrl(options?: GetDatabaseUrlOptions): string {
  const cwd = options?.cwd ?? process.cwd()
  const env = options?.env ?? process.env
  const fromEnv = env.DATABASE_URL?.trim()

  if (!fromEnv) {
    throw new Error('DATABASE_URL is required')
  }

  return normalizeDatabaseUrl(fromEnv, cwd)
}
