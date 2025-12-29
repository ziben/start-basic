import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '~/generated/prisma/client'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'

// PrismaClient 单例，避免在 SSR/dev 热重载下重复创建连接
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: DATABASE_URL })
  return new PrismaClient({ adapter })
}

export function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

const prisma = getDb()
export default prisma

