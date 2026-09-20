import { beforeEach, expect, it, vi } from 'vitest'
import { ServiceError } from '~/shared/utils/service-error'
import { chatInputSchema, handleChat } from './chat.fn'

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), adapter: vi.fn(), chat: vi.fn() }))
vi.mock('~/modules/auth/shared/lib/require-auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('../lib/ai-config', () => ({ getAIAdapter: mocks.adapter }))
vi.mock('@tanstack/ai', () => ({ chat: mocks.chat, toServerSentEventsResponse: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

it('rejects unauthenticated calls before creating an AI adapter', async () => {
  mocks.requireUser.mockRejectedValue(new ServiceError('UNAUTHORIZED'))
  await expect(handleChat({ data: { messages: [{ role: 'user', content: 'hello' }] } })).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  })
  expect(mocks.adapter).not.toHaveBeenCalled()
  expect(mocks.chat).not.toHaveBeenCalled()
})

it('rejects malformed message input', () => {
  expect(() => chatInputSchema.parse({ messages: 'invalid' })).toThrow()
  expect(mocks.chat).not.toHaveBeenCalled()
})
