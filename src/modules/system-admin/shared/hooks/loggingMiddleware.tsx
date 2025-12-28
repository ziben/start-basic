import { createMiddleware } from '@tanstack/react-start'
import { logger } from '@/shared/utils/logger'

type LogContext = {
  clientTime?: Date
  serverTime?: Date
  durationToServer?: number
}

type MiddlewareCtx = {
  next: (opts?: { context?: LogContext; sendContext?: LogContext }) => Promise<{
    context?: LogContext
  }>
  context?: LogContext
}

const enableClientTimingLog = import.meta.env.DEV || import.meta.env.VITE_ENABLE_CLIENT_TIMING_LOG === 'true'

const preLogMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx: MiddlewareCtx) => {
    const clientTime = new Date()

    return ctx.next({
      context: { clientTime },
      sendContext: { clientTime },
    })
  })
  .server(async (ctx: MiddlewareCtx) => {
    const serverTime = new Date()
    const clientTime = ctx.context?.clientTime
    const durationToServer = clientTime ? serverTime.getTime() - clientTime.getTime() : undefined

    return ctx.next({
      context: {
        ...ctx.context,
        serverTime,
        durationToServer,
      },
      sendContext: {
        serverTime,
        durationToServer,
      },
    })
  })

export const logMiddleware = createMiddleware({ type: 'function' })
  .middleware([preLogMiddleware])
  .client(async (ctx: MiddlewareCtx) => {
    const res = await ctx.next()
    const now = new Date()
    const { clientTime, serverTime, durationToServer } = res.context ?? {}

    const durationTotal = clientTime ? now.getTime() - clientTime.getTime() : undefined
    const durationFromServer = serverTime ? now.getTime() - serverTime.getTime() : undefined

    if (enableClientTimingLog) {
      logger.debug('Client Req/Res:', {
        durationTotal,
        durationToServer,
        durationFromServer,
      })
    }

    return res
  })
