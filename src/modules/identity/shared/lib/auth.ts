import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, username, organization } from 'better-auth/plugins'
import { defaultRoles } from 'better-auth/plugins/admin/access'
import prisma from '@/shared/lib/db'

const ADMIN_ROLES = ['admin', 'superadmin'] as const

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
      adminRoles: [...ADMIN_ROLES],
      roles: {
        ...defaultRoles,
        superadmin: defaultRoles.admin,
      },
    }),
  ],
})
