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
    'postgresql://zc:7ESAfHjx8NzA@58.87.66.50:5432/zc?schema=public',
    cwd
  )
}
