import { hashPassword } from 'better-auth/crypto'
import { createHash } from 'node:crypto'
import { getDb } from '~/shared/lib/db'
import { Prisma, ResourceScope, RoleScope } from '../../../src/generated/prisma/client'
import en from '../../../src/i18n/locales/en'
import zh from '../../../src/i18n/locales/zh'
import { syncAdminNavigation } from '../../../src/modules/admin/shared/sidebar/sync-admin-navigation'

type RuntimeConfigSeedItem = {
  key: string
  value: string
  description: string
}

const runtimeConfigSeedItems: RuntimeConfigSeedItem[] = [
  {
    key: 'log.requestBody.enabled',
    value: JSON.stringify(false),
    description: '是否记录请求体（布尔）',
  },
  {
    key: 'log.dir',
    value: JSON.stringify('logs'),
    description: '日志目录（字符串）',
  },
  {
    key: 'log.system.sampleRate',
    value: JSON.stringify(1),
    description: '系统日志采样率（0-1）',
  },
  {
    key: 'log.system.sampleLevels',
    value: JSON.stringify(['info']),
    description: '受采样影响的日志级别（字符串数组）',
  },
  {
    key: 'log.maxBodyBytes',
    value: JSON.stringify(8 * 1024),
    description: '日志记录的请求体最大字节数',
  },
  {
    key: 'ai.enabled',
    value: JSON.stringify(false),
    description: '是否启用 AI 功能',
  },
  {
    key: 'ai.provider',
    value: JSON.stringify('gemini'),
    description: 'AI 提供商（gemini/openai）',
  },
  {
    key: 'ai.model',
    value: JSON.stringify('gemini-3-flash-preview'),
    description: '默认 AI 模型',
  },
  {
    key: 'auth.trustedOrigins',
    value: JSON.stringify([]),
    description: 'Better Auth 可信来源（字符串数组）',
  },
]

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const res: Record<string, string> = {}
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) res[prefix] = String(obj ?? '')
    return res
  }

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(res, flatten(value, path))
    } else {
      res[path] = String(value ?? '')
    }
  }
  return res
}

type SeedRole = Prisma.RoleGetPayload<Record<string, never>>
type SeedResource = Prisma.ResourceGetPayload<Record<string, never>>
type SeedAction = Prisma.ActionGetPayload<Record<string, never>>

async function seedTranslations(prisma: Prisma.TransactionClient): Promise<void> {
  const rows = [
    ...Object.entries(flatten(en)).map(([key, value]) => ({ locale: 'en', key, value })),
    ...Object.entries(flatten(zh)).map(([key, value]) => ({ locale: 'zh', key, value })),
  ]

  if (rows.length === 0) return

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "translation" ("id", "locale", "key", "value")
      VALUES ${Prisma.join(
        rows.map((row) => {
          const id = createHash('sha256').update(`${row.locale}:${row.key}`).digest('hex')

          return Prisma.sql`(${id}, ${row.locale}, ${row.key}, ${row.value})`
        })
      )}
      ON CONFLICT ("locale", "key")
      DO UPDATE SET "value" = EXCLUDED."value"
    `
  )
  console.log(`Translations complete. upserted=${rows.length}`)
}

export async function seedBase() {
  const prisma = await getDb()

  try {
    await prisma.$transaction((tx) => seedBaseData(tx))
  } finally {
    await prisma.$disconnect()
  }
}

export async function seedAdminUser(prisma: Prisma.TransactionClient): Promise<void> {
  const adminEmail = 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim()

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin' },
    create: {
      id: 'admin-user-id',
      name: 'Admin',
      email: adminEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'admin',
    },
  })

  const existingAccount = await prisma.account.findFirst({
    where: { userId: adminUser.id, providerId: 'credential' },
  })

  if (existingAccount) {
    if (existingAccount.accountId !== adminUser.id || adminPassword) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accountId: adminUser.id,
          ...(adminPassword ? { password: await hashPassword(adminPassword) } : {}),
        },
      })
    }
  } else {
    if (!adminPassword) {
      throw new Error('SEED_ADMIN_PASSWORD is required when creating the seed admin account')
    }
    await prisma.account.create({
      data: {
        id: 'admin-account-id',
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: 'credential',
        password: await hashPassword(adminPassword),
      },
    })
  }
  console.log(`Admin user ${adminEmail} initialized.`)
}

async function seedBaseData(prisma: Prisma.TransactionClient): Promise<void> {
  console.log('Starting base seed...')

  console.log('Seeding translations...')
  await seedTranslations(prisma)

  console.log('Seeding runtime configs...')
  for (const item of runtimeConfigSeedItems) {
    await prisma.systemConfig.upsert({
      where: { key: item.key },
      update: { value: item.value, description: item.description },
      create: { key: item.key, value: item.value, description: item.description },
    })
  }
  console.log(`Runtime configs complete. upserted=${runtimeConfigSeedItems.length}`)

  console.log('Seeding admin user...')
  await seedAdminUser(prisma)

  console.log('Seeding RBAC data...')

  const rolesData = [
    {
      name: 'superadmin',
      displayName: '超级管理员',
      description: '系统最高权限',
      scope: RoleScope.GLOBAL,
      isSystem: true,
      sortOrder: 1,
      category: '系统管理',
    },
    {
      name: 'admin',
      displayName: '管理员',
      description: '系统管理员',
      scope: RoleScope.GLOBAL,
      isSystem: true,
      sortOrder: 2,
      category: '系统管理',
    },
    {
      name: 'user',
      displayName: '普通用户',
      description: '普通用户',
      scope: RoleScope.GLOBAL,
      isSystem: true,
      sortOrder: 3,
      category: '系统管理',
    },
    {
      name: 'org-owner',
      displayName: '组织所有者',
      description: '组织内所有权限',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      isTemplate: true,
      sortOrder: 10,
      category: '组织管理',
    },
    {
      name: 'org-admin',
      displayName: '组织管理员',
      description: '组织管理权限',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      isTemplate: true,
      sortOrder: 11,
      category: '组织管理',
    },
    {
      name: 'org-member',
      displayName: '组织成员',
      description: '组织普通成员',
      scope: RoleScope.ORGANIZATION,
      isSystem: true,
      isTemplate: true,
      sortOrder: 12,
      category: '组织管理',
    },
  ]

  const roles: Record<string, SeedRole> = {}
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({ where: { name: r.name }, update: r, create: r })
  }

  const resourcesData = [
    { name: 'user', displayName: '用户', scope: ResourceScope.GLOBAL, isSystem: true },
    { name: 'role', displayName: '角色', scope: ResourceScope.GLOBAL, isSystem: true },
    { name: 'permission', displayName: '权限', scope: ResourceScope.GLOBAL, isSystem: true },
    { name: 'organization', displayName: '组织', scope: ResourceScope.ORGANIZATION, isSystem: true },
    { name: 'member', displayName: '成员', scope: ResourceScope.ORGANIZATION, isSystem: true },
    { name: 'org-role', displayName: '组织角色', scope: ResourceScope.ORGANIZATION, isSystem: true },
    { name: 'navigation', displayName: '导航', scope: ResourceScope.BOTH, isSystem: true },
    { name: 'audit-log', displayName: '审计日志', scope: ResourceScope.GLOBAL, isSystem: true },
    { name: 'system-log', displayName: '系统日志', scope: ResourceScope.GLOBAL, isSystem: true },
  ]

  const resources: Record<string, SeedResource> = {}
  for (const res of resourcesData) {
    resources[res.name] = await prisma.resource.upsert({ where: { name: res.name }, update: res, create: res })
  }

  const actionsData = [
    { name: 'create', displayName: '创建' },
    { name: 'read', displayName: '查看' },
    { name: 'update', displayName: '更新' },
    { name: 'delete', displayName: '删除' },
    { name: 'list', displayName: '列表' },
    { name: 'manage', displayName: '管理' },
    { name: 'export', displayName: '导出' },
    { name: 'import', displayName: '导入' },
    { name: 'ban', displayName: '封禁' },
    { name: 'unban', displayName: '解封' },
  ]

  const actions: Record<string, Record<string, SeedAction>> = {}
  for (const resName in resources) {
    actions[resName] = {}
    for (const a of actionsData) {
      actions[resName][a.name] = await prisma.action.upsert({
        where: { resourceId_name: { resourceId: resources[resName].id, name: a.name } },
        update: { displayName: a.displayName },
        create: { ...a, resourceId: resources[resName].id, isSystem: true },
      })
    }
  }

  for (const resName in resources) {
    for (const actName in actions[resName]) {
      const code = `${resName}:${actName}`
      const perm = await prisma.permission.upsert({
        where: { code },
        update: { displayName: `${actions[resName][actName].displayName}${resources[resName].displayName}` },
        create: {
          code,
          displayName: `${actions[resName][actName].displayName}${resources[resName].displayName}`,
          resourceId: resources[resName].id,
          actionId: actions[resName][actName].id,
          isSystem: true,
          category: resources[resName].displayName,
        },
      })

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['superadmin'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['superadmin'].id, permissionId: perm.id, dataScope: 'ALL' },
      })

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['admin'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['admin'].id, permissionId: perm.id, dataScope: 'ALL' },
      })
    }
  }

  console.log('Seeding sidebar data...')

  const ensureNavGroup = async (
    data: {
      title: string
      scope: 'APP' | 'ADMIN'
      orderIndex: number
      navItems: { title: string; url: string; icon: string; orderIndex: number }[]
    },
    roleNames: string[]
  ) => {
    const existing = await prisma.navGroup.findFirst({
      where: { title: data.title, scope: data.scope },
      select: { id: true },
    })

    const group = existing
      ? await prisma.navGroup.update({
          where: { id: existing.id },
          data: { orderIndex: data.orderIndex },
        })
      : await prisma.navGroup.create({
          data: { title: data.title, scope: data.scope, orderIndex: data.orderIndex },
        })

    for (const roleName of roleNames) {
      await prisma.roleNavGroup.upsert({
        where: { roleName_navGroupId: { roleName, navGroupId: group.id } },
        update: {},
        create: { roleName, navGroupId: group.id },
      })
    }

    for (const item of data.navItems) {
      const existingItem = await prisma.navItem.findFirst({
        where: { navGroupId: group.id, OR: [{ url: item.url }, { title: item.title }] },
        select: { id: true },
      })

      if (existingItem) {
        await prisma.navItem.update({
          where: { id: existingItem.id },
          data: item,
        })
      } else {
        await prisma.navItem.create({
          data: { ...item, navGroupId: group.id },
        })
      }
    }
  }

  const ensureAppNavGroup = (data: {
    title: string
    orderIndex: number
    navItems: { title: string; url: string; icon: string; orderIndex: number }[]
  }) => ensureNavGroup({ ...data, scope: 'APP' }, ['user', 'admin', 'superadmin'])

  await ensureAppNavGroup({
    title: '常规',
    orderIndex: 0,
    navItems: [{ title: '仪表盘', url: '/', icon: 'LayoutDashboard', orderIndex: 0 }],
  })

  await syncAdminNavigation(prisma)

  console.log('Base seed complete successfully.')
}
