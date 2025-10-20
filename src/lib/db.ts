import { PrismaClient } from "~/generated/prisma/client";

export function getDb() {
    const prisma = new PrismaClient()

    return prisma
}

const prisma = getDb()
export default prisma