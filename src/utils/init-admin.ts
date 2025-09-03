import { createHash } from '@better-auth/utils/hash'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const adminEmail = 'admin@example.com'
    const adminPassword = 'AdminPassword123!'
    const hashedPassword = await createHash(adminPassword)

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log('管理员用户已存在:', adminEmail)
      return
    }

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: '系统管理员',
        hashedPassword: hashedPassword, // 假设字段名称为 hashedPassword
        emailVerified: true,
        role: 'ADMIN', // 假设有一个 role 字段来表示用户角色
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
