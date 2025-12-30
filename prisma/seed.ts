import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'
import en from '../src/i18n/locales/en'
import zh from '../src/i18n/locales/zh'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
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

    // 1. Seed Roles
    console.log('Seeding roles...')
    const roles = [
      { name: 'admin', label: '管理员', isSystem: true, description: '系统超级管理员' },
      { name: 'user', label: '普通用户', isSystem: true, description: '普通注册用户' },
    ]

    for (const role of roles) {
      await prisma.systemRole.upsert({
        where: { name: role.name },
        update: { label: role.label, isSystem: role.isSystem, description: role.description },
        create: role,
      })
    }

    // 2. Seed Translations
    console.log('Seeding translations...')
    const enFlat = flatten(en)
    const zhFlat = flatten(zh)

    let inserted = 0
    let updated = 0

    // Upsert en
    for (const [key, value] of Object.entries(enFlat)) {
      const existing = await prisma.translation
        .findUnique({
          where: {
            locale_key: { locale: 'en', key },
          },
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
          where: {
            locale_key: { locale: 'zh', key },
          },
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

    // 3. Initialize Admin User
    console.log('Seeding admin user...')
    const adminEmail = 'admin@example.com'
    const adminRole = await prisma.systemRole.findUnique({ where: { name: 'admin' } })
    
    if (adminRole) {
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          systemRoles: {
            set: [{ id: adminRole.id }]
          },
          role: 'admin'
        },
        create: {
          id: 'admin-user-id',
          name: 'Admin',
          email: adminEmail,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'admin',
          systemRoles: {
            connect: [{ id: adminRole.id }]
          }
        }
      })
      console.log(`Admin user ${adminEmail} initialized and linked to admin role.`)
    }

    // 4. Initialize Sidebar Data (Simplified version for seed)
    console.log('Seeding sidebar data...')
    const navGroupCount = await prisma.navGroup.count()
    if (navGroupCount === 0) {
      // Create a default admin group
      const adminRole = await prisma.systemRole.findUnique({ where: { name: 'admin' } })
      if (adminRole) {
        const dashboardGroup = await prisma.navGroup.create({
          data: {
            title: 'Dashboard',
            scope: 'ADMIN',
            orderIndex: 0,
            roleNavGroups: {
              create: [{ roleId: adminRole.id }],
            },
            navItems: {
              create: [
                {
                  title: 'Overview',
                  url: '/admin',
                  orderIndex: 0,
                },
                {
                  title: 'Users',
                  url: '/admin/users',
                  orderIndex: 1,
                },
                {
                  title: 'Roles',
                  url: '/admin/roles',
                  orderIndex: 2,
                },
              ],
            },
          },
        })
        console.log('Default admin sidebar group created.')
      }
    }

    console.log('Seed complete successfully.')
  } catch (err) {
    console.error('Seeding failed', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
