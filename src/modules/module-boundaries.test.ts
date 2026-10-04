import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AppModule } from '~/core/module-registry'
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
  it('enforces declared dependencies across static, dynamic, and relative imports', () => {
    const modules = new Map((moduleRegistry.modules as readonly AppModule[]).map((module) => [module.key, module]))
    const violations: string[] = []

    for (const module of moduleRegistry.modules as readonly AppModule[]) {
      const moduleDir = join(process.cwd(), 'src/modules', module.key)
      for (const file of collectSourceFiles(moduleDir)) {
        const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
        for (const match of source.matchAll(/(?:from|import\s*\()\s*['"]([^'"]+)['"]/g)) {
          const imported = match[1]
          const target = getImportedModuleKey(file, imported)
          const isCompatibilityImport = COMPATIBILITY_IMPORTS.has(imported)
          if (
            target &&
            !isCompatibilityImport &&
            target !== module.key &&
            !(modules.get(module.key)?.dependencies ?? []).includes(target as never)
          ) {
            violations.push(`${relative(process.cwd(), file).replace(/\\/g, '/')}: ${target}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('requires every registered dependency to be present', () => {
    const keys = new Set<string>(moduleRegistry.modules.map((module) => module.key))
    const missing = (moduleRegistry.modules as readonly AppModule[]).flatMap((module) =>
      (module.dependencies ?? [])
        .filter((dependency) => !keys.has(dependency))
        .map((dependency) => `${module.key}: ${dependency}`)
    )
    expect(missing).toEqual([])
  })

  it('keeps shared Prisma access within the owning module', () => {
    const owner: Record<string, string> = {
      user: 'auth',
      account: 'auth',
      session: 'auth',
      member: 'auth',
      role: 'auth',
      rolePermission: 'auth',
      organizationRole: 'auth',
      organizationRolePermission: 'auth',
      navGroup: 'navigation',
      navItem: 'navigation',
      roleNavGroup: 'navigation',
      userRoleNavGroup: 'navigation',
      paymentOrder: 'payment',
      auditLog: 'audit',
      systemLog: 'audit',
      healthReport: 'health',
      healthMetricResult: 'health',
      healthMetricCatalog: 'health',
      aIConversation: 'ai',
      aIMessage: 'ai',
    }
    const violations: string[] = []
    for (const module of moduleRegistry.modules as readonly AppModule[]) {
      for (const file of collectSourceFiles(join(process.cwd(), 'src/modules', module.key, 'shared'))) {
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(/\b(?:prisma|tx|[A-Za-z_$][\w$]*\.prisma)\.([a-z]\w*)\s*\./g)) {
          const tableOwner = owner[match[1]]
          if (tableOwner && tableOwner !== module.key) {
            violations.push(`${relative(process.cwd(), file).replace(/\\/g, '/')}: ${match[1]} (${tableOwner})`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('registers navigation as the shared menu capability module', () => {
    const navigation = moduleRegistry.getModule('navigation')

    expect(navigation.dependencies).toEqual(['auth'])
    expect(Object.keys(navigation.exports.services ?? {})).toEqual(['NavGroupService', 'NavItemService'])
  })

  it('keeps extracted module sources from importing legacy admin features', () => {
    const moduleOwnedFiles = collectSourceFiles(join(process.cwd(), 'src/modules')).filter((file) => {
      const normalized = relative(process.cwd(), file).replace(/\\/g, '/')
      return /src\/modules\/(audit|navigation|payment)\/(admin|shared)\//.test(normalized)
    })

    const violations = moduleOwnedFiles.flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return content.includes('modules/admin/features/navigation')
        ? [relative(process.cwd(), file).replace(/\\/g, '/')]
        : []
    })

    expect(violations).toEqual([])
  })

  it('keeps the old admin payment feature index as a compatibility re-export', () => {
    const indexPath = join(process.cwd(), 'src/modules/admin/features/payment/index.ts')
    const content = readFileSync(indexPath, 'utf8')

    expect(content).toContain("export * from '~/modules/payment/admin'")
    expect(content).not.toContain('prisma.paymentOrder')
  })

  it('keeps admin payment server functions delegated to the payment admin adapter', () => {
    const serverFnPath = join(process.cwd(), 'src/modules/payment/admin/server-fns/payment-order.fn.ts')
    const content = readFileSync(serverFnPath, 'utf8')

    expect(content).toContain("import('../services/payment-order-admin.service')")
    expect(content).not.toContain('../services/payment-order.service')
  })

  it('keeps the legacy admin payment feature directory as a thin compatibility entry', () => {
    const legacyFiles = collectSourceFiles(join(process.cwd(), 'src/modules/admin/features/payment')).map((file) =>
      relative(process.cwd(), file).replace(/\\/g, '/')
    )

    expect(legacyFiles).toEqual(['src/modules/admin/features/payment/index.ts'])
  })

  it('keeps the admin payment route mounted to the payment module admin page', () => {
    const routePath = join(process.cwd(), 'src/routes/_authenticated/admin/payment/orders.tsx')
    const content = readFileSync(routePath, 'utf8')

    expect(content).toContain("from '~/modules/payment/admin'")
    expect(content).not.toContain('~/modules/admin/features/payment')
  })

  it('keeps the payment admin barrel free of server-only service exports', () => {
    const indexPath = join(process.cwd(), 'src/modules/payment/admin/index.ts')
    const content = readFileSync(indexPath, 'utf8')

    expect(content).not.toContain('PaymentOrderAdminService,')
    expect(content).not.toContain('defaultPaymentOrderAdminService')
  })

  it('keeps sidebar database loading behind a server-only boundary', () => {
    const serverFnPath = join(process.cwd(), 'src/modules/admin/shared/sidebar/api.fn.ts')
    const content = readFileSync(serverFnPath, 'utf8')

    expect(content).toContain('createServerOnlyFn(async (scope: SidebarScope)')
  })

  it('keeps the legacy admin audit feature directory as a thin compatibility entry', () => {
    const legacyFiles = collectSourceFiles(join(process.cwd(), 'src/modules/admin/features/audit')).map((file) =>
      relative(process.cwd(), file).replace(/\\/g, '/')
    )

    expect(legacyFiles).toEqual(['src/modules/admin/features/audit/index.ts'])
  })

  it('keeps the admin audit route mounted to the audit module admin page', () => {
    const routePath = join(process.cwd(), 'src/routes/_authenticated/admin/log.tsx')
    const content = readFileSync(routePath, 'utf8')

    expect(content).toContain("from '~/modules/audit/admin'")
    expect(content).not.toContain('~/modules/admin')
  })
})

const COMPATIBILITY_IMPORTS = new Set([
  '~/modules/admin/shared/server-fns/auth',
  '~/modules/admin/shared/lib/user-hooks',
  '~/modules/admin/shared/utils/admin-utils',
  '@/modules/admin/shared/components/admin-data-table',
  '~/modules/admin/features/system-config/hooks/use-system-config-query',
  '~/modules/admin/shared/hooks/use-translation',
  '~/modules/admin/features/rbac/system-roles/hooks/use-role-api',
  '~/modules/rbac/system-roles/hooks/use-role-api',
  '~/modules/system-config/hooks/use-system-config-query',
  '~/modules/events',
  '../../../../admin/shared/lib/user-hooks',
  '../../../admin/shared/lib/user-hooks',
])

function getImportedModuleKey(file: string, imported: string): string | null {
  if (imported.startsWith('~/modules/') || imported.startsWith('@/modules/')) {
    return imported.split('/')[2] ?? null
  }

  if (!imported.startsWith('.')) return null

  const candidate = resolve(dirname(file), imported)
  const normalized = candidate.replace(/\\/g, '/')
  const marker = '/src/modules/'
  const index = normalized.indexOf(marker)
  if (index < 0) return null

  const remainder = normalized.slice(index + marker.length)
  return remainder.split('/')[0] ?? null
}
