import { registerGlobalMiddleware } from '@tanstack/react-start';
import { authMiddleware } from './utils/auth-guard';
import { logMiddleware } from './utils/loggingMiddleware';

registerGlobalMiddleware({
  middleware: [logMiddleware, authMiddleware],
})

