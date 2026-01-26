import path from 'node:path'
import { pathToFileURL } from 'node:url'

function normalizeDatabaseUrl(url: string, cwd: string): string {
  if (!url.startsWith('file:')) {
    return url
  }

  const rest = url.slice('file:'.length)

  if (rest.startsWith('//') || rest.startsWith('/')) {
    return url
  }

  const absPath = path.resolve(cwd, rest)
  return pathToFileURL(absPath).href
}

export function getDatabaseUrl(options?: { cwd?: string }): string {
  const cwd = options?.cwd ?? process.cwd()
  const fromEnv = process.env.DATABASE_URL?.trim()

  if (fromEnv) {
    return normalizeDatabaseUrl(fromEnv, cwd)
  }

  return normalizeDatabaseUrl('file:./db/dev.db', cwd)
}
