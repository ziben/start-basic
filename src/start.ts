// src/start.ts
import { createStart } from '@tanstack/react-start'
import { metricsMiddleware } from './infrastructure/observability/request-middleware'
import { logMiddleware } from './modules/admin/shared/hooks/loggingMiddleware'
import { authMiddleware } from './modules/auth/shared/lib/auth-guard'
import { serverErrorMiddleware } from './shared/server-fns/error-middleware'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [metricsMiddleware, authMiddleware],
    functionMiddleware: [serverErrorMiddleware, logMiddleware],
  }
})
