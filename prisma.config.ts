import { defineConfig } from 'prisma/config'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL,
  },
})
