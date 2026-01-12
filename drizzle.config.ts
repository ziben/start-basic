import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './db/drizzle',
    schema: './src/db/drizzle/schema.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
