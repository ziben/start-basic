import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('server environment example', () => {
  it('documents the PostgreSQL runtime contract', () => {
    const content = readFileSync(join(process.cwd(), '.env.server.example'), 'utf8')
    expect(content).toContain('DATABASE_URL=postgresql://')
    expect(content).not.toContain('DATABASE_URL=file:')
  })
})
