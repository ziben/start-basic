// src/start.ts
import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './modules/identity/shared/lib/auth-guard'
import { logMiddleware } from './modules/system-admin/shared/hooks/loggingMiddleware'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
    functionMiddleware: [logMiddleware]
  }
})

