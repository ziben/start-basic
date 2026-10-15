import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuestionBankBootstrap } from './hooks'

const state = vi.hoisted(() => ({ actor: { id: 'first', role: 'user' }, bootstrap: vi.fn() }))
vi.mock('~/shared/context/auth-context', () => ({ useAuth: () => ({ user: state.actor }) }))
vi.mock('./server-fns/question-bank.fn', () => ({
  questionBankBootstrapFn: state.bootstrap,
  questionBankCommandFn: vi.fn(),
  searchBankQuestionsFn: vi.fn(),
  getQuestionPaperFn: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
  state.actor = { id: 'first', role: 'user' }
})
describe('private query cache isolation', () => {
  it('does not display the previous users cached data after switching accounts', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    state.bootstrap.mockResolvedValueOnce({ actorId: 'first' }).mockImplementation(() => new Promise(() => {}))
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => useQuestionBankBootstrap(), { wrapper })
    await waitFor(() => expect(hook.result.current.data?.actorId).toBe('first'))
    state.actor = { id: 'second', role: 'user' }
    hook.rerender()
    expect(hook.result.current.data).toBeUndefined()
    expect(hook.result.current.isPending).toBe(true)
    hook.unmount()
    client.clear()
  })
  it('does not reuse public maintenance data after the current users role changes', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    state.actor = { id: 'first', role: 'admin' }
    state.bootstrap
      .mockResolvedValueOnce({ actorId: 'first', canManagePublic: true })
      .mockImplementation(() => new Promise(() => {}))
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => useQuestionBankBootstrap(), { wrapper })
    await waitFor(() => expect(hook.result.current.data?.canManagePublic).toBe(true))
    state.actor = { id: 'first', role: 'user' }
    hook.rerender()
    expect(hook.result.current.data).toBeUndefined()
    hook.unmount()
    client.clear()
  })
})
