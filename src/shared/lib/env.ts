/**
 * Environment Variables Configuration
 *
 * This module validates and exports all environment variables used in the application.
 * It uses Zod for runtime validation to ensure all required variables are present
 * and have the correct format.
 */

import { z } from 'zod'

/**
 * Schema for validating environment variables
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Application URL
  APP_URL: z.string().url().default('http://localhost:3000'),
  VITE_APP_URL: z.string().url().optional(),

  // Better Auth configuration
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),

  // Authentication token cookie key
  AUTH_TOKEN_KEY: z.string().default('app_access_token'),

  // Optional email configuration
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_SERVER: z.string().url().optional(),

  // Optional Sentry configuration
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
})

/**
 * Type inference from the schema
 */
export type Env = z.infer<typeof envSchema>

/**
 * Parse and validate environment variables
 *
 * For client-side: Uses import.meta.env (Vite convention)
 * For server-side: Uses process.env
 */
function parseEnv(): Env {
  // Collect env vars from both sources
  const rawEnv: Record<string, unknown> = {
    ...process.env,
  }

  // Vite exposes env vars with VITE_ prefix to client
  // @ts-ignore - import.meta is Vite specific
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore - import.meta.env is Vite specific
    rawEnv.VITE_APP_URL = import.meta.env.VITE_APP_URL
  }

  const result = envSchema.safeParse(rawEnv)

  if (!result.success) {
    const missingVars = result.error.issues
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(
      `Invalid environment configuration:\n${missingVars}\n\nPlease check your .env file.`
    )
  }

  return result.data
}

/**
 * Validated environment variables
 *
 * Usage:
 * ```ts
 * import { env } from '@/shared/lib/env'
 *
 * if (env.NODE_ENV === 'development') {
 *   // ...
 * }
 * ```
 */
export const env = parseEnv()

/**
 * Helper to get the public app URL (accessible from client)
 */
export function getAppUrl(): string {
  return env.VITE_APP_URL || env.APP_URL
}

/**
 * Helper to check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

/**
 * Helper to check if running in production mode
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

/**
 * Helper to check if running in test mode
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}




