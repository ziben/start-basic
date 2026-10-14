import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getDatabaseUrl } from '../src/infrastructure/db/database-url'
import { getDb } from '../src/infrastructure/db/prisma-client'
import { adminNavigationGroups } from '../src/modules/admin/shared/sidebar/admin-navigation'
import { syncAdminNavigation } from '../src/modules/admin/shared/sidebar/sync-admin-navigation'

async function main(): Promise<void> {
  const database = new URL(getDatabaseUrl())
  if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
    throw new Error('This script only updates the local development database')
  }
  const prisma = await getDb()
  try {
    const current = await prisma.navGroup.findMany({
      where: { scope: 'ADMIN' },
      orderBy: { orderIndex: 'asc' },
      include: { navItems: { orderBy: { orderIndex: 'asc' } }, roleNavGroups: true, userRoleNavGroups: true },
    })
    if (!process.argv.includes('--apply')) {
      console.log(
        JSON.stringify(
          {
            current: current.map(({ title, navItems, roleNavGroups }) => ({
              title,
              roles: roleNavGroups.map(({ roleName }) => roleName),
              items: navItems.map(({ title, url }) => ({ title, url })),
            })),
            desired: adminNavigationGroups,
          },
          null,
          2
        )
      )
      return
    }

    const backupPath = path.join(tmpdir(), `start-basic-admin-navigation-${Date.now()}.json`)
    await writeFile(backupPath, JSON.stringify(current, null, 2), { flag: 'wx' })
    console.log(`Backup: ${backupPath}`)
    await prisma.$transaction((tx) => syncAdminNavigation(tx), { timeout: 20_000 })
    const updated = await prisma.navGroup.findMany({
      where: { scope: 'ADMIN' },
      orderBy: { orderIndex: 'asc' },
      include: { navItems: { orderBy: { orderIndex: 'asc' } } },
    })
    console.log(
      JSON.stringify(
        updated.map(({ title, navItems }) => ({
          title,
          items: navItems.map(({ title, url }) => ({ title, url })),
        })),
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Navigation sync failed')
  process.exitCode = 1
})
