// src/start.ts
import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './utils/auth-guard'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
  }
})
