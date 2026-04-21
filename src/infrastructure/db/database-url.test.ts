import { describe, expect, it } from 'vitest'
import { getDatabaseUrl } from './database-url'

describe('getDatabaseUrl', () => {
  it('normalizes relative sqlite urls against cwd', () => {
    const value = getDatabaseUrl({
      cwd: 'Z:/labs/start-basic',
      env: {
        DATABASE_URL: 'file:./db/dev.db',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe('file:Z:/labs/start-basic/db/dev.db')
  })

  it('keeps absolute postgres urls unchanged', () => {
    const value = getDatabaseUrl({
      cwd: 'Z:/labs/start-basic',
      env: {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app?schema=public',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe('postgresql://user:pass@localhost:5432/app?schema=public')
  })

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      getDatabaseUrl({
        cwd: 'Z:/labs/start-basic',
        env: {} as NodeJS.ProcessEnv,
      }),
    ).toThrow('DATABASE_URL is required')
  })
})
