import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const prismaDir = join(root, 'db', 'prisma')

describe('PostgreSQL migration contract', () => {
  it('uses the merged PostgreSQL schema and the active migration directory', () => {
    const config = readFileSync(join(root, 'prisma.config.ts'), 'utf8')
    const schema = readFileSync(join(prismaDir, 'schema.prisma'), 'utf8')
    const activeMigrations = join(prismaDir, 'migrations_pg')

    expect(config).toContain("path: 'db/prisma/migrations_pg'")
    expect(schema).toMatch(/datasource\s+\w+\s*\{[\s\S]*provider\s*=\s*"postgresql"/)
    expect(schema.match(/^\s*datasource\s+\w+\s*\{/gm)).toHaveLength(1)
    expect(schema.match(/^\s*generator\s+\w+\s*\{/gm)).toHaveLength(1)
    expect(existsSync(activeMigrations)).toBe(true)
    expect(readdirSync(activeMigrations, { withFileTypes: true }).some((entry) => entry.isDirectory())).toBe(true)
  })

  it('does not add SQLite migrations to the active PostgreSQL path', () => {
    const activeMigrations = join(prismaDir, 'migrations_pg')
    const migrationSql = readdirSync(activeMigrations, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(activeMigrations, entry.name, 'migration.sql'))
      .filter(existsSync)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')

    expect(migrationSql).not.toMatch(/\bPRAGMA\b|\bAUTOINCREMENT\b/i)
  })
})
