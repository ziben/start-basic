import { defineConfig } from 'prisma/config'
import { getDatabaseUrl } from './src/shared/lib/database-url'

const DATABASE_URL = getDatabaseUrl()

export default defineConfig({
  schema: 'db/prisma/schema.prisma',
  migrations: {
    seed: 'pnpm exec tsx db/prisma/seed.ts',
    path: 'db/prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL,
  },
})
