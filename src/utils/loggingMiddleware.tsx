import { createMiddleware } from '@tanstack/react-start';


const preLogMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx: any) => {
    const clientTime = new Date()

    return ctx.next({
      context: {
        clientTime,
      },
      sendContext: {
        clientTime,
      },
    })
  })
  .server(async (ctx: any) => {
    const serverTime = new Date()

    return ctx.next({
      sendContext: {
        serverTime,
      },
    })
  })

export const logMiddleware = createMiddleware({ type: 'function' })
  .middleware([preLogMiddleware])
  .client(async (ctx: any) => {
    console.log(ctx)
    const res = await ctx.next()
    console.log(ctx)
    const now = new Date()
    console.log('Client Req/Res:', {
      duration: res.context.clientTime.getTime() - now.getTime(),
      durationToServer: res.context.durationToServer,
      durationFromServer: now.getTime() - res.context.serverTime.getTime(),
    })

    return res
  })