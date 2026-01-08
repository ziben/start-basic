import { PrismaLibSql } from '@prisma/adapter-libsql'

import { PrismaClient } from '../../src/generated/prisma/client'
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

    // 2. Initialize Admin User
    console.log('Seeding admin user...')
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123' // 默认密码
    
    // 使用 better-auth 的密码哈希
    const { hashPassword } = await import('better-auth/crypto')
    const hashedPassword = await hashPassword(adminPassword)
    
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
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
      }
    })
    
    // 创建密码凭证账户
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: adminUser.id,
        providerId: 'credential',
      }
    })
    
    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword }
      })
    } else {
      await prisma.account.create({
        data: {
          id: 'admin-account-id',
          userId: adminUser.id,
          accountId: adminEmail,
          providerId: 'credential',
          password: hashedPassword,
        }
      })
    }
    
    console.log(`Admin user ${adminEmail} initialized with password: ${adminPassword}`)

    // 3. Initialize Sidebar Data
    console.log('Seeding sidebar data...')
    const navGroupCount = await prisma.navGroup.count()
    if (navGroupCount === 0) {
      await prisma.navGroup.create({
        data: {
          title: 'Dashboard',
          scope: 'ADMIN',
          orderIndex: 0,
          roleNavGroups: {
            create: [{ role: 'admin' }],
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

    console.log('Seed complete successfully.')
  } catch (err) {
    console.error('Seeding failed', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
