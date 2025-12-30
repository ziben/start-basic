import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: 'file:./prisma/dev.db' }) })

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
