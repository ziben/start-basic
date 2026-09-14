// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { receiveBrowserMetric } from './browser-metrics'

it('accepts bounded browser measurements and rejects payloads with sensitive fields or oversized bodies', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  const send = (body: string) =>
    receiveBrowserMetric(new Request('http://localhost/api/metrics', { method: 'POST', body }))
  try {
    expect((await send(JSON.stringify({ name: 'FCP', value: 120 }))).status).toBe(204)
    expect((await send(JSON.stringify({ name: 'FCP', value: -1 }))).status).toBe(400)
    expect((await send(JSON.stringify({ name: 'FCP', value: 120, userId: 'private' }))).status).toBe(400)
    expect((await send('x'.repeat(513))).status).toBe(413)
    expect(log).toHaveBeenCalledTimes(1)
  } finally {
    log.mockRestore()
  }
})
