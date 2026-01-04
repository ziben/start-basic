import { defineConfig } from 'prisma/config'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db'

export default defineConfig({
  schema: 'db/prisma/schema.prisma',
  migrations: {
    path: 'db/prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL,
  },
})
