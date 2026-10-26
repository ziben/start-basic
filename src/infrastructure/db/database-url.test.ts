import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getDatabaseUrl } from './database-url'

const workspace = resolve('fixtures', 'start-basic')

describe('getDatabaseUrl', () => {
  it('normalizes relative sqlite urls against cwd', () => {
    const value = getDatabaseUrl({
      cwd: workspace,
      env: {
        DATABASE_URL: 'file:./db/dev.db',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe(`file:${resolve(workspace, 'db', 'dev.db').replace(/\\/g, '/')}`)
  })

  it('keeps absolute postgres urls unchanged', () => {
    const value = getDatabaseUrl({
      cwd: workspace,
      env: {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app?schema=public',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe('postgresql://user:pass@localhost:5432/app?schema=public')
  })

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      getDatabaseUrl({
        cwd: workspace,
        env: {} as NodeJS.ProcessEnv,
      })
    ).toThrow('DATABASE_URL is required')
  })
})
