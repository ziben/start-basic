import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient, RoleScope, ResourceScope } from '../../src/generated/prisma/client'
import en from '../../src/i18n/locales/en'
import zh from '../../src/i18n/locales/zh'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db'
const adapter = new PrismaLibSql({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

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

async function seed() {
  try {
    console.log('Starting seed...')

    // 1. Seed Translations
    console.log('Seeding translations...')
    const enFlat = flatten(en)
    const zhFlat = flatten(zh)

    let inserted = 0
    let updated = 0

    // Upsert en
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

    // Upsert zh
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

    // 2. Initialize Admin User
    console.log('Seeding admin user...')
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const { hashPassword } = await import('better-auth/crypto')
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

    // 3. Initialize RBAC Data (Integrated from rbac-seed.ts)
    console.log('Seeding RBAC data from rbac-seed...')

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
      }
    }
    console.log('RBAC data integrated.')

    // 4. Initialize Sidebar Data
    console.log('Seeding sidebar data...')
    const navGroupCount = await prisma.navGroup.count()
    if (navGroupCount === 0) {
      await prisma.navGroup.create({
        data: {
          title: '试验区',
          scope: 'ADMIN',
          orderIndex: 0,
          roleNavGroups: { create: [{ role: 'admin' }] },
          navItems: {
            create: [
              { title: 'App', url: '/demo/users', orderIndex: 0 },
              { title: 'Chats', url: '/demo/chats', orderIndex: 1 },
              { title: 'Tasks', url: '/demo/tasks', orderIndex: 2 },
              { title: 'Profile', url: '/demo/profile', orderIndex: 3 },
              { title: 'Settings', url: '/demo/settings', orderIndex: 4 },
              { title: 'Users', url: '/demo/users', orderIndex: 5 },
              { title: 'Drizzle', url: '/demo/drizzle', orderIndex: 6 },
            ],
          },
        },
      })
      await prisma.navGroup.create({
        data: {
          title: '系统管理',
          scope: 'ADMIN',
          orderIndex: 0,
          roleNavGroups: { create: [{ role: 'admin' }] },
          navItems: {
            create: [
              { title: '菜单管理', url: '/admin/navigation', orderIndex: 0 },
              { title: '用户管理', url: '/admin/users', orderIndex: 1 },
              { title: '系统角色', url: '/admin/rbac/roles', orderIndex: 2 },
              { title: '组织角色', url: '/admin/rbac/org-roles', orderIndex: 3 },
              { title: '权限定义', url: '/admin/rbac/permissions', orderIndex: 4 },
              { title: '日志管理', url: '/admin/log', orderIndex: 5 },
            ],
          },
        },
      })
      console.log('Default admin sidebar group created.')
    }

    console.log('Seed complete successfully.')
  } catch (err) {
    console.error('Seeding failed', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
