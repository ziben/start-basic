import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, username, organization } from 'better-auth/plugins'
import { reactStartCookies } from 'better-auth/react-start'
import { PrismaClient } from '~/generated/prisma'

const prisma = new PrismaClient()
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite', // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    username(),
    organization(),
    admin({
      adminRoles: ['admin', 'user'],
    }),
    reactStartCookies(),
  ],
})
