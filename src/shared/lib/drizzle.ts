import { drizzle } from 'drizzle-orm/libsql'

const DATABASE_URL = process.env.DATABASE_PGLITE_URL!

export const db = drizzle({ logger: true, connection: { url: DATABASE_URL } })
export default db
