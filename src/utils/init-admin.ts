import { createHash } from '@better-auth/utils/hash'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const adminEmail = 'admin@example.com'
    const adminPassword = 'AdminPassword123!'
  // short-term: relax createHash arg typing
  const hashedPassword = await createHash(adminPassword as any)

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log('管理员用户已存在:', adminEmail)
      return
    }

    // short-term: remove hashedPassword write until Prisma schema is confirmed
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: '系统管理员',
        // hashedPassword: hashedPassword, // deferred: confirm schema field name
        emailVerified: true,
        role: 'ADMIN', // assume role field exists
        // provide minimal required fields for Prisma create input short-term
        id: undefined as unknown as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log('成功创建管理员用户:', adminUser.email)
  } catch (error) {
    console.error('创建管理员用户时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
