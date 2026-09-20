import { notFound, redirect } from '@tanstack/react-router'
import { expect, it, vi } from 'vitest'
import { ServiceError } from '../utils/service-error'
import { handleServerErrors as run } from './error-middleware'

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({ server: (handler: unknown) => handler }),
}))

it('preserves success values and normalizes rejected handlers', async () => {
  const value = { result: { id: 'ok' } }
  expect(await run({ next: async () => value })).toBe(value)
  await expect(
    run({
      next: async () => {
        throw new ServiceError('FORBIDDEN')
      },
    })
  ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403, success: false })
})

it('preserves framework control flow and streaming responses', async () => {
  for (const error of [notFound(), redirect({ href: '/sign-in' }), new Response('stream')]) {
    await expect(
      run({
        next: async () => {
          throw error
        },
      })
    ).rejects.toBe(error)
  }
})
