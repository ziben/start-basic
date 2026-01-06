import { createAuthClient } from 'better-auth/client'
import { adminClient, usernameClient, organizationClient } from 'better-auth/client/plugins'
import { ac, superadmin, adminRole, userRole } from './auth'

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: {
        superadmin,
        admin: adminRole,
        user: userRole,
      },
    }),
    organizationClient({
      teams: {
        enabled: true,
      },
      dynamicAccessControl: {
        enabled: true,
      },
    }),
  ],
})

