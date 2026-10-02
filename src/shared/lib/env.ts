import { z } from 'zod'

// Shared by SSR and the browser: only explicitly public Vite configuration belongs here.
const envSchema = z.object({
  VITE_APP_URL: z.string().url().optional(),
  VITE_PC_HOMEPAGE_ROUTE: z.string().default('/'),
  VITE_MOBILE_HOMEPAGE_ROUTE: z.string().default('/'),
  VITE_APP_NAME: z.string().default('Zi Start'),
  VITE_APP_DESC: z.string().default('Zi Start.'),
  VITE_ADMIN_APP_NAME: z.string().optional(),
  VITE_ADMIN_APP_DESC: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse({
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_PC_HOMEPAGE_ROUTE: import.meta.env.VITE_PC_HOMEPAGE_ROUTE,
  VITE_MOBILE_HOMEPAGE_ROUTE: import.meta.env.VITE_MOBILE_HOMEPAGE_ROUTE,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_DESC: import.meta.env.VITE_APP_DESC,
  VITE_ADMIN_APP_NAME: import.meta.env.VITE_ADMIN_APP_NAME,
  VITE_ADMIN_APP_DESC: import.meta.env.VITE_ADMIN_APP_DESC,
})
