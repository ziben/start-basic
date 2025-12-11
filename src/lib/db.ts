import { PrismaClient } from "~/generated/prisma/client";

// PrismaClient 单例，避免在 SSR/dev 热重载下重复创建连接
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient();
}

export function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

const prisma = getDb();
export default prisma;