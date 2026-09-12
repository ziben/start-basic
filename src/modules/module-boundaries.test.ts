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

  it('keeps extracted module sources from importing legacy admin features', () => {
    const moduleOwnedFiles = collectSourceFiles(join(process.cwd(), 'src/modules')).filter((file) => {
      const normalized = relative(process.cwd(), file).replace(/\\/g, '/')
      return /src\/modules\/(audit|navigation|payment)\/(admin|shared)\//.test(normalized)
    })

    const violations = moduleOwnedFiles.flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return content.includes('modules/admin/features') ? [relative(process.cwd(), file).replace(/\\/g, '/')] : []
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
