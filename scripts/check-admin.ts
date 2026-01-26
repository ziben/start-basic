import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'
import { getDatabaseUrl } from '../src/shared/lib/database-url'

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: getDatabaseUrl() }) })

async function check() {
    const accounts = await prisma.account.findMany({
        where: { user: { email: 'admin@example.com' } }
    })
    console.log('Accounts:', JSON.stringify(accounts, null, 2))

    const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
    })
    console.log('User:', JSON.stringify(user, null, 2))

    await prisma.$disconnect()
}

check()
