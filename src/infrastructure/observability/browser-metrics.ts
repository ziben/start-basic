import { z } from 'zod'

const metricSchema = z
  .object({
    name: z.enum(['FCP', 'LCP', 'TTFB', 'LOAD']),
    value: z.number().finite().min(0).max(3_600_000),
  })
  .strict()

export async function receiveBrowserMetric(request: Request): Promise<Response> {
  // 限制真实读取的字节数，不信任 Content-Length。
  const reader = request.body?.getReader()
  if (!reader) return new Response(null, { status: 400 })
  let body = ''
  let bytes = 0
  const decoder = new TextDecoder()
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 512) {
        await reader.cancel()
        return new Response(null, { status: 413 })
      }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
    const metric = metricSchema.parse(JSON.parse(body))
    console.info(
      JSON.stringify({
        event: 'browser_metric',
        source: 'untrusted-client',
        timestamp: new Date().toISOString(),
        ...metric,
      })
    )
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 400 })
  } finally {
    reader.releaseLock()
  }
}
