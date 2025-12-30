/**
 * 初始化管理员脚本
 * 使用方法: npx tsx scripts/init-admin.ts
 * 
 * 可选环境变量:
 * - ADMIN_EMAIL: 管理员邮箱 (默认: admin@example.com)
 * - ADMIN_PASSWORD: 管理员密码 (默认: Admin123!)
 * - ADMIN_NAME: 管理员名称 (默认: Admin)
 */

import { hashPassword } from 'better-auth/crypto'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
const adapter = new PrismaLibSql({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// 配置
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin123!'
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Admin'

async function initAdmin() {
  console.log('🚀 开始初始化管理员...')
  console.log(`📧 邮箱: ${ADMIN_EMAIL}`)
  console.log(`👤 名称: ${ADMIN_NAME}`)

  try {
    // 1. 确保 admin 角色存在
    console.log('\n📋 检查系统角色...')
    let adminRole = await prisma.systemRole.findUnique({ where: { name: 'admin' } })

    if (!adminRole) {
      console.log('  创建 admin 角色...')
      adminRole = await prisma.systemRole.create({
        data: {
          name: 'admin',
          label: '管理员',
          isSystem: true,
          description: '系统超级管理员'
        }
      })
    }
    console.log('  ✅ admin 角色已就绪')

    // 2. 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: { accounts: true }
    })

    if (existingUser) {
      console.log(`\n⚠️  用户 ${ADMIN_EMAIL} 已存在`)

      // 检查是否有 credential 账户
      const credentialAccount = existingUser.accounts.find(a => a.providerId === 'credential')

      if (!credentialAccount) {
        console.log('  用户没有密码账户，正在创建...')

        // 使用 Better Auth 的密码哈希函数
        const hashedPassword = await hashPassword(ADMIN_PASSWORD)

        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: existingUser.id,
            accountId: existingUser.id,
            providerId: 'credential',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('  ✅ 密码账户已创建')
      } else {
        console.log('  用户已有密码账户，正在更新密码...')

        // 使用 Better Auth 的密码哈希函数
        const hashedPassword = await hashPassword(ADMIN_PASSWORD)

        await prisma.account.update({
          where: { id: credentialAccount.id },
          data: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        })
        console.log('  ✅ 密码已更新')
      }

      // 更新用户角色
      console.log('  正在更新为管理员角色...')
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: 'admin',
          systemRoles: {
            connect: [{ id: adminRole.id }]
          }
        }
      })
      console.log('  ✅ 用户已更新为管理员')
    } else {
      // 3. 创建新管理员用户
      console.log('\n👤 创建管理员用户...')

      // 使用 Better Auth 的密码哈希函数
      const hashedPassword = await hashPassword(ADMIN_PASSWORD)
      const userId = crypto.randomUUID()

      // 创建用户
      await prisma.user.create({
        data: {
          id: userId,
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          emailVerified: true,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          systemRoles: {
            connect: [{ id: adminRole.id }]
          }
        }
      })

      // 创建账户 (密码认证)
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: userId,
          accountId: userId,
          providerId: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('  ✅ 管理员用户创建成功')
    }

    console.log('\n✨ 管理员初始化完成!')
    console.log('\n📝 登录信息:')
    console.log(`   邮箱: ${ADMIN_EMAIL}`)
    console.log(`   密码: ${ADMIN_PASSWORD}`)
    console.log('\n⚠️  请在首次登录后修改密码!')

  } catch (error) {
    console.error('\n❌ 初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initAdmin()
