import { PrismaClient } from '~/generated/prisma/client'
import { getDatabaseUrl } from '~/shared/lib/database-url'
import { PrismaPg } from '@prisma/adapter-pg'
const DATABASE_URL = getDatabaseUrl()

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

async function createPrismaClient(): Promise<PrismaClient> {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter })
}

export async function getDb(): Promise<PrismaClient> {
  globalForPrisma.prisma ??= await createPrismaClient();

  return globalForPrisma.prisma
}

let prismaInstance: PrismaClient | null = null

async function initPrisma(): Promise<PrismaClient> {
  prismaInstance ??= await getDb();
  return prismaInstance
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined
    if (!prismaInstance) {
      throw new Error('Prisma client not initialized. Call await getDb() or getDbSync() first.')
    }
    return (prismaInstance as any)[prop]
  },
})

/**
 * 获取 Prisma 实例（同步，但必须确保已在入口初始化）
 */
export function getDbSync(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('Prisma client not initialized.')
  }
  return prismaInstance
}

// 只在服务端初始化
if (typeof window === 'undefined') {
  initPrisma().catch(console.error)
}

export default prisma
