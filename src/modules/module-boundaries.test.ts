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

function isDataLayerPath(relativePath: string): boolean {
  return /\/shared\/|\/services\/|\/server-fns\//.test(relativePath)
}

function touchesDbClient(source: string): boolean {
  return /['"][^'"]*\/shared\/lib\/db['"]/.test(source)
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

  it('keeps Prisma access within the owning module across all module sources', () => {
    const violations: string[] = []
    for (const module of moduleRegistry.modules as readonly AppModule[]) {
      for (const file of collectSourceFiles(join(process.cwd(), 'src/modules', module.key))) {
        if (file.includes('.test.')) continue
        const relativePath = relative(process.cwd(), file).replace(/\\/g, '/')
        const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
        if (!isDataLayerPath(relativePath)) {
          if (touchesDbClient(source)) {
            violations.push(`${relativePath}: 数据库访问只允许位于 shared/services/server-fns 数据层`)
          }
          continue
        }
        for (const violation of findTableViolations(source, module.key)) {
          violations.push(`${relativePath}: ${violation}`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('flags prisma aliases, destructuring, and getDb handles that bypass ownership', () => {
    const alias = 'const p = prisma\nexport const f = () => p.user.findFirst({ where: { id: "1" } })'
    expect(findTableViolations(alias, 'payment')).toContain('p.user (auth)')

    const destructured = 'const { user } = prisma\nexport const g = () => user.findFirst({ where: { id: "1" } })'
    expect(findTableViolations(destructured, 'payment')).toContain('user (auth)')

    const dbHandle = 'const db = await getDb()\nexport const h = () => db.auditLog.createMany({ data: [] })'
    expect(findTableViolations(dbHandle, 'payment')).toContain('db.auditLog (audit)')

    const txHandle = 'async function run(tx: Prisma.TransactionClient) {\n  return tx.navGroup.findMany()\n}'
    expect(findTableViolations(txHandle, 'payment')).toContain('tx.navGroup (navigation)')
  })

  it('keeps legitimate same-owner and excepted accesses out of violations', () => {
    expect(
      findTableViolations('const db = await getDb()\nexport const f = () => db.paymentOrder.findFirst()', 'payment')
    ).toEqual([])
    expect(findTableViolations("prisma.user.findUnique({ where: { id: '1' } })", 'identity')).toEqual([])
    expect(isDataLayerPath('src/modules/rbac/services/role-assignment.service.ts')).toBe(true)
    expect(isDataLayerPath('src/modules/payment/features/order-page.tsx')).toBe(false)
  })

  it('resolves undeclared cross-module imports for static, dynamic, and relative specifiers', () => {
    const file = join(process.cwd(), 'src/modules/payment/shared/services/prepay.service.ts')
    const payment = (moduleRegistry.modules as readonly AppModule[]).find((module) => module.key === 'payment')
    const declared = payment?.dependencies ?? []
    expect(declared).not.toContain('health')

    const specifiers = [
      '~/modules/health/shared/services/health-report.service',
      '../../../health/shared/services/health-report.service',
    ]
    for (const specifier of specifiers) {
      expect(getImportedModuleKey(file, specifier)).toBe('health')
    }

    const dynamicImport = "const m = await import('~/modules/health/shared/services/health-report.service')"
    const match = dynamicImport.match(/(?:from|import\s*\()\s*['"]([^'"]+)['"]/)
    expect(getImportedModuleKey(file, match?.[1] ?? '')).toBe('health')
  })

  it('constrains unregistered module directories to the documented page-organization allowlist', () => {
    const PAGE_ORGANIZATION_DIRS: Record<string, string> = {
      admin: '旧管理端兼容层：仅转发到 payment/audit/navigation 等真实实现',
      ai: 'AI 聊天页面组织目录：数据访问在 shared/services，aIConversation/aIMessage 所有权待模块正式注册',
      dashboard: '仪表盘展示组件目录，不含数据访问',
      mobile: '移动端页面组织目录，复用 Web 路由',
      settings: '设置页面组织目录',
    }
    const registered = new Set<string>(moduleRegistry.modules.map((module) => module.key))
    const actual = readdirSync(join(process.cwd(), 'src/modules'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    const unexpected = actual.filter((dir) => !registered.has(dir) && !(dir in PAGE_ORGANIZATION_DIRS))
    const stale = Object.keys(PAGE_ORGANIZATION_DIRS).filter((dir) => !actual.includes(dir))
    expect({ unexpected, stale }).toEqual({ unexpected: [], stale: [] })
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
const TABLE_OWNER: Record<string, string> = {
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
  healthPerson: 'health',
  healthMetricResult: 'health',
  healthMetricCatalog: 'health',
  questionBank: 'question-bank',
  bankQuestion: 'question-bank',
  questionKnowledgePoint: 'question-bank',
  questionPaper: 'question-bank',
  questionPaperSection: 'question-bank',
  questionPaperItem: 'question-bank',
  questionImportBatch: 'question-bank',
  aIConversation: 'ai',
  aIMessage: 'ai',
}

// 历史遗留的直接跨所有权访问，显式记录；重新划分所有权前不得扩大（STA-19）。
const PRISMA_OWNERSHIP_EXCEPTIONS: Record<string, readonly string[]> = {
  identity: ['auth'],
  organization: ['auth'],
  rbac: ['auth', 'navigation'],
}

const PRISMA_CRUD = 'findUnique|findFirst|findMany|create|createMany|update|updateMany|delete|deleteMany|upsert|count|aggregate|groupBy'

function collectDbHandles(source: string): { handles: Set<string>; destructured: Map<string, string> } {
  const handles = new Set<string>(['prisma', 'tx'])
  const destructured = new Map<string, string>()
  for (const match of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:prisma|getDb\(\))/g)) {
    handles.add(match[1])
  }
  for (const match of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*\(\s*await\s+import\([^)]*shared\/lib\/db[^)]*\)\s*\)\s*\.\s*default/g)) {
    handles.add(match[1])
  }
  for (const match of source.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*(?:await\s+)?prisma\b/g)) {
    for (const piece of match[1].split(',')) {
      const parts = piece.split(':').map((segment) => segment.trim())
      if (parts[0]) destructured.set(parts[1] ?? parts[0], parts[0])
    }
  }
  for (const match of source.matchAll(/(\w+)\s*:\s*(?:Prisma\.)?TransactionClient/g)) {
    handles.add(match[1])
  }
  for (const match of source.matchAll(/(\w+)\.prisma\b/g)) {
    handles.add(match[1])
  }
  return { handles, destructured }
}

function findTableViolations(source: string, moduleKey: string): string[] {
  const allowedOwners = PRISMA_OWNERSHIP_EXCEPTIONS[moduleKey] ?? []
  const { handles, destructured } = collectDbHandles(source)
  const violations: string[] = []
  for (const match of source.matchAll(/\b(\w+)\.([a-z]\w*)\s*\./g)) {
    if (!handles.has(match[1])) continue
    const owner = TABLE_OWNER[match[2]]
    if (owner && owner !== moduleKey && !allowedOwners.includes(owner)) {
      violations.push(`${match[1]}.${match[2]} (${owner})`)
    }
  }
  for (const match of source.matchAll(new RegExp(`\\b(\\w+)\\.(?:${PRISMA_CRUD})\\s*\\(`, 'g'))) {
    const table = destructured.get(match[1])
    if (!table) continue
    const owner = TABLE_OWNER[table]
    if (owner && owner !== moduleKey && !allowedOwners.includes(owner)) {
      violations.push(`${match[1]} (${owner})`)
    }
  }
  return violations
}

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
