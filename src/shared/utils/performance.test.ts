import { expect, it, vi } from 'vitest'
import { reportWebVitals } from './performance'

it('collects buffered FCP and final LCP, posts only measurements, and disconnects on cleanup', () => {
  const callbacks: Array<PerformanceObserverCallback> = []
  const disconnect = vi.fn()
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('PerformanceObserver', class {
    static supportedEntryTypes = ['paint', 'largest-contentful-paint']
    constructor(callback: PerformanceObserverCallback) { callbacks.push(callback) }
    observe() {}
    disconnect = disconnect
  })
  const cleanup = reportWebVitals()
  try {
    const deliver = (index: number, entry: Partial<PerformanceEntry>) => callbacks[index](
      { getEntries: () => [entry] } as PerformanceObserverEntryList, {} as PerformanceObserver)
    deliver(0, { name: 'first-contentful-paint', startTime: 150, entryType: 'paint' })
    deliver(1, { startTime: 400, entryType: 'largest-contentful-paint' })
    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new Event('pagehide'))
    expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body))).toEqual([
      { name: 'FCP', value: 150 }, { name: 'LCP', value: 400 },
    ])
  } finally { cleanup?.(); vi.unstubAllGlobals() }
  expect(disconnect).toHaveBeenCalledTimes(2)
})
