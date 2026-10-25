import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRenameConversation } from './use-chat-history'

const state = vi.hoisted(() => ({ rename: vi.fn() }))
vi.mock('../server-fns/ai-chat.fn', () => ({
  listConversationsFn: vi.fn(),
  getConversationMsgsFn: vi.fn(),
  createConversationFn: vi.fn(),
  deleteConversationFn: vi.fn(),
  renameConversationFn: state.rename,
}))

beforeEach(() => {
  vi.resetAllMocks()
})

function renderRenameHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useRenameConversation(), { wrapper })
  return { hook, client }
}

describe('useRenameConversation', () => {
  it('invalidates the conversation list after a successful rename', async () => {
    state.rename.mockResolvedValue({ id: 'conv-1', title: '新标题' })
    const { hook, client } = renderRenameHook()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    hook.result.current.mutate({ conversationId: 'conv-1', title: '新标题' })
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))

    expect(state.rename).toHaveBeenCalledWith({ data: { conversationId: 'conv-1', title: '新标题' } })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ai', 'conversations'] })
  })

  it('surfaces the server error instead of reporting success', async () => {
    state.rename.mockRejectedValue(new Error('Conversation not found'))
    const { hook } = renderRenameHook()

    hook.result.current.mutate({ conversationId: 'conv-1', title: '新标题' })
    await waitFor(() => expect(hook.result.current.isError).toBe(true))

    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toBe('Conversation not found')
  })
})
