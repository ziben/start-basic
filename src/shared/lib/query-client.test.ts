import { expect, it } from 'vitest'
import { createQueryClient, shouldRetryQuery, CACHE_TIME } from './query-client'

it('does not retry client failures but retries transient errors once', () => {
  for (const status of [400, 401, 403, 404, 409, 429]) expect(shouldRetryQuery(0, { status })).toBe(false)
  expect(shouldRetryQuery(0, { status: 500 })).toBe(true)
  expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true)
  expect(shouldRetryQuery(1, new Error('network'))).toBe(false)
  expect(createQueryClient().getDefaultOptions()).toMatchObject({
    queries: { staleTime: CACHE_TIME.MEDIUM, retry: shouldRetryQuery },
    mutations: { retry: 0 },
  })
})
