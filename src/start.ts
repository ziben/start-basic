// src/start.ts
import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './modules/auth/shared/lib/auth-guard'
import { logMiddleware } from './modules/admin/shared/hooks/loggingMiddleware'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
    functionMiddleware: [logMiddleware]
  }
})

