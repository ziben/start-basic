import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '~/generated/prisma/client'
import { getDatabaseUrl } from './database-url'
import { recordSlowQuery } from '../observability/metrics'

const DATABASE_URL = getDatabaseUrl()
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

async function createPrismaClient(): Promise<PrismaClient> {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL })
  const client = new PrismaClient({ adapter, log: [{ emit: 'event', level: 'query' }] })
  client.$on('query', (event) => recordSlowQuery(event.duration))
  return client
}

export async function getDb(): Promise<PrismaClient> {
  globalForPrisma.prisma ??= await createPrismaClient()
  return globalForPrisma.prisma
}

let prismaInstance: PrismaClient | null = null

async function initPrisma(): Promise<PrismaClient> {
  prismaInstance ??= await getDb()
  return prismaInstance
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined
    if (!prismaInstance) {
      throw new Error('Prisma client not initialized. Call await getDb() or getDbSync() first.')
    }
    return (prismaInstance as PrismaClient & Record<PropertyKey, unknown>)[prop]
  },
})

export function getDbSync(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('Prisma client not initialized.')
  }
  return prismaInstance
}

if (typeof window === 'undefined') {
  initPrisma().catch(console.error)
}

export default prisma
