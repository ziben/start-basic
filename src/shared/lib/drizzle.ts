import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '~/db/drizzle/schema';

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db';

const client = createClient({
    url: DATABASE_URL,
});

export const db = drizzle(client, { schema });
export default db;
