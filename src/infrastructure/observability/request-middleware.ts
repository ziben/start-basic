import { createMiddleware } from '@tanstack/react-start'
import { recordRequest } from './metrics'

export const metricsMiddleware = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  const start = performance.now()
  let status = 500
  try {
    const result = await next()
    status = result.response.status
    return result
  } catch (error) {
    if (error instanceof Response) status = error.status
    throw error
  } finally {
    recordRequest(status, performance.now() - start, request.method)
  }
})
