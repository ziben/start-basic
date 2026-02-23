import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'node:crypto'
import { getDb } from '~/shared/lib/db'
import { ResourceScope, RoleScope } from '../../../src/generated/prisma/client'
import en from '../../../src/i18n/locales/en'
import zh from '../../../src/i18n/locales/zh'

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

function flatten(obj: any, prefix = ''): Record<string, string> {
  const res: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(res, flatten(value, path))
    } else {
      res[path] = String(value ?? '')
    }
  }
  return res
}

export async function seedBase() {
  const prisma = await getDb()

  try {
    console.log('Starting base seed...')

    console.log('Seeding translations...')
    const enFlat = flatten(en)
    const zhFlat = flatten(zh)

    let inserted = 0
    let updated = 0

    for (const [key, value] of Object.entries(enFlat)) {
      const existing = await prisma.translation
        .findUnique({
          where: { locale_key: { locale: 'en', key } },
        })
        .catch(() => null)
      if (existing) {
        await prisma.translation.update({ where: { id: existing.id }, data: { value } })
        updated++
      } else {
        await prisma.translation.create({ data: { locale: 'en', key, value } })
        inserted++
      }
    }

    for (const [key, value] of Object.entries(zhFlat)) {
      const existing = await prisma.translation
        .findUnique({
          where: { locale_key: { locale: 'zh', key } },
        })
        .catch(() => null)
      if (existing) {
        await prisma.translation.update({ where: { id: existing.id }, data: { value } })
        updated++
      } else {
        await prisma.translation.create({ data: { locale: 'zh', key, value } })
        inserted++
      }
    }
    console.log(`Translations complete. inserted=${inserted}, updated=${updated}`)

    console.log('Seeding runtime configs...')
    for (const item of runtimeConfigSeedItems) {
      await prisma.$executeRaw`
        INSERT INTO "system_config" ("id", "key", "value", "description", "updatedAt")
        VALUES (${randomUUID()}, ${item.key}, ${item.value}, ${item.description}, NOW())
        ON CONFLICT ("key")
        DO UPDATE SET
          "value" = EXCLUDED."value",
          "description" = EXCLUDED."description",
          "updatedAt" = NOW()
      `
    }
    console.log(`Runtime configs complete. upserted=${runtimeConfigSeedItems.length}`)

    console.log('Seeding admin user...')
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const hashedPassword = await hashPassword(adminPassword)

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
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      })
    } else {
      await prisma.account.create({
        data: {
          id: 'admin-account-id',
          userId: adminUser.id,
          accountId: adminEmail,
          providerId: 'credential',
          password: hashedPassword,
        },
      })
    }
    console.log(`Admin user ${adminEmail} initialized.`)

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

    const roles: Record<string, any> = {}
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

    const resources: Record<string, any> = {}
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

    const actions: Record<string, any> = {}
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

    const ensureAdminNavGroup = async (data: {
      title: string
      orderIndex: number
      navItems: { title: string; url: string; icon: string; orderIndex: number }[]
    }) => {
      const existing = await prisma.navGroup.findFirst({
        where: { title: data.title, scope: 'ADMIN' },
        select: { id: true },
      })

      if (existing) {
        return
      }

      await prisma.navGroup.create({
        data: {
          title: data.title,
          scope: 'ADMIN',
          orderIndex: data.orderIndex,
          roleNavGroups: { create: [{ roleName: 'admin' }, { roleName: 'superadmin' }] },
          navItems: { create: data.navItems },
        },
      })
    }

    const ensureAppNavGroup = async (data: {
      title: string
      orderIndex: number
      navItems: { title: string; url: string; icon: string; orderIndex: number }[]
    }) => {
      const existing = await prisma.navGroup.findFirst({
        where: { title: data.title, scope: 'APP' },
        select: { id: true },
      })

      if (existing) {
        return
      }

      await prisma.navGroup.create({
        data: {
          title: data.title,
          scope: 'APP',
          orderIndex: data.orderIndex,
          roleNavGroups: { create: [{ roleName: 'user' }, { roleName: 'admin' }, { roleName: 'superadmin' }] },
          navItems: { create: data.navItems },
        },
      })
    }

    await ensureAppNavGroup({
      title: '常规',
      orderIndex: 0,
      navItems: [
        { title: '仪表盘', url: '/', icon: 'LayoutDashboard', orderIndex: 0 },
      ],
    })

    await ensureAdminNavGroup({
      title: '仪表盘',
      orderIndex: -1,
      navItems: [{ title: '系统概览', url: '/admin/dashboard', icon: 'LayoutDashboard', orderIndex: 0 }],
    })

    await ensureAdminNavGroup({
      title: '系统管理',
      orderIndex: 90,
      navItems: [
        { title: '菜单管理', url: '/admin/navigation', icon: 'List', orderIndex: 1 },
        { title: 'I18N管理', url: '/admin/translation', icon: 'Users', orderIndex: 2 },
        { title: '用户管理', url: '/admin/users', icon: 'Users', orderIndex: 3 },
        { title: '账号管理', url: '/admin/accounts', icon: 'User', orderIndex: 4 },
        { title: '会话管理', url: '/admin/sessions', icon: 'Lock', orderIndex: 5 },
        { title: '系统角色', url: '/admin/rbac/roles', icon: 'Shield', orderIndex: 6 },
        { title: '组织角色', url: '/admin/rbac/org-roles', icon: 'Building', orderIndex: 7 },
        { title: '权限定义', url: '/admin/rbac/permissions', icon: 'Key', orderIndex: 8 },
        { title: '组织管理', url: '/admin/organizations', icon: 'Building', orderIndex: 9 },
        { title: '成员管理', url: '/admin/members', icon: 'Users', orderIndex: 10 },
        { title: '部门管理', url: '/admin/department', icon: 'Building', orderIndex: 11 },
      ],
    })

    console.log('Base seed complete successfully.')
  } finally {
    await prisma.$disconnect()
  }
}
