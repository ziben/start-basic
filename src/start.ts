// src/start.ts
import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './utils/auth-guard'
import { logMiddleware } from './utils/loggingMiddleware'

export const startInstance = createStart(() => {
    return {
        requestMiddleware: [authMiddleware],
    }
})