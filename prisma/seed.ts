import { initSidebarData } from '../src/routes/api/sidebar/controller'
import { PrismaClient } from '../src/generated/prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const adminEmail = 'admin@example.com'
    const adminPassword = 'AdminPassword123!'
    const userId = randomUUID()
    const now = new Date()

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log('管理员用户已存在:', adminEmail)
      return
    }

    // 创建User记录
    const adminUser = await prisma.user.create({
      data: {
        id: userId,
        email: adminEmail,
        name: '系统管理员',
        emailVerified: true,
        role: 'admin',
        username: 'admin',
        createdAt: now,
        updatedAt: now
      },
    })
    
    // 创建Account记录，存储密码
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: 'local',
        providerId: 'local',
        userId: userId,
        password: adminPassword, // 实际环境中应该使用哈希密码
        createdAt: now,
        updatedAt: now
      }
    })

    console.log('成功创建管理员用户:', adminUser.email)
  } catch (error) {
    console.error('创建管理员用户时出错:', error)
  }
}

async function main() {
  // 初始化侧边栏数据
  await initSidebarData()
  console.log('侧边栏数据已初始化')
  
  // 初始化admin用户
  await createAdminUser()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
