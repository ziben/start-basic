import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleRegistry } from './index'

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      return collectSourceFiles(fullPath)
    }

    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : []
  })
}

describe('module boundaries', () => {
  it('registers navigation as the shared menu capability module', () => {
    const navigation = moduleRegistry.getModule('navigation')

    expect(navigation.dependencies).toEqual(['auth'])
    expect(Object.keys(navigation.exports.services ?? {})).toEqual(['NavGroupService', 'NavItemService'])
  })

  it('keeps shared module sources from importing admin feature implementations', () => {
    const sharedModuleFiles = collectSourceFiles(join(process.cwd(), 'src/modules')).filter((file) => {
      const normalized = relative(process.cwd(), file).replace(/\\/g, '/')
      return /src\/modules\/(audit|navigation)\/shared\//.test(normalized)
    })

    const violations = sharedModuleFiles.flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return content.includes('modules/admin/features')
        ? [relative(process.cwd(), file).replace(/\\/g, '/')]
        : []
    })

    expect(violations).toEqual([])
  })
})
