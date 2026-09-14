// src/start.ts
import { createStart } from '@tanstack/react-start'
import { metricsMiddleware } from './infrastructure/observability/request-middleware'
import { logMiddleware } from './modules/admin/shared/hooks/loggingMiddleware'
import { authMiddleware } from './modules/auth/shared/lib/auth-guard'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [metricsMiddleware, authMiddleware],
    functionMiddleware: [logMiddleware],
  }
})
