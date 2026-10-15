import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AdminAccount from './account-page'

const mocks = vi.hoisted(() => ({
  overview: vi.fn(),
  reset: vi.fn(),
  unlink: vi.fn(),
  session: vi.fn(),
}))
vi.mock('./server-fns/account.fn', () => ({
  getAdminAccountFn: mocks.overview,
  setAdminPasswordFn: mocks.reset,
  unlinkAdminAccountFn: mocks.unlink,
}))
vi.mock('~/modules/auth/shared/lib/auth-client', () => ({ authClient: { getSession: mocks.session } }))
vi.mock('~/modules/admin/shared/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@tanstack/react-router', () => ({ useSearch: () => ({ userId: 'user-1' }) }))
vi.mock('~/components/layout/app-header-main', () => ({ AppHeaderMain: ({ children }: any) => children }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const clients: QueryClient[] = []
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  clients.push(client)
  return render(
    <QueryClientProvider client={client}>
      <AdminAccount />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ data: null })
  mocks.overview.mockResolvedValue({
    user: { id: 'user-1', name: 'Alice' },
    session: { id: null, expiresAt: null, user: { id: 'admin-1' } },
    accounts: [{ id: 'account-1', providerId: 'test-provider', accountId: 'external-1', createdAt: new Date() }],
  })
  mocks.reset.mockResolvedValue({ success: true })
  mocks.unlink.mockResolvedValue({ success: true })
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
})

it('requires confirmation before resetting a password and preserves the exact input', async () => {
  mount()
  await waitFor(() => expect(screen.getByLabelText('新密码')).toBeEnabled())
  fireEvent.change(screen.getByLabelText('新密码'), { target: { value: ' sample-password ' } })
  fireEvent.click(screen.getByRole('button', { name: '重置密码' }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Alice')
  expect(mocks.reset).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '确认' }))
  await waitFor(() =>
    expect(mocks.reset).toHaveBeenCalledWith({
      data: { userId: 'user-1', newPassword: ' sample-password ' },
    })
  )
})

it('does not unlink an account when the administrator cancels confirmation', async () => {
  mount()
  await waitFor(() => expect(screen.getByRole('button', { name: '解绑' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: '解绑' }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Alice')
  fireEvent.click(screen.getByRole('button', { name: '取消' }))
  expect(mocks.unlink).not.toHaveBeenCalled()
})

it('keeps the confirmation open when unlinking fails so the administrator can retry', async () => {
  mocks.unlink.mockRejectedValueOnce(new Error('unlink unavailable'))
  mount()
  await waitFor(() => expect(screen.getByRole('button', { name: '解绑' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: '解绑' }))
  fireEvent.click(screen.getByRole('button', { name: '确认' }))
  await waitFor(() => expect(mocks.unlink).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.getByRole('button', { name: '确认' })).toBeEnabled())
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Alice')
  fireEvent.click(screen.getByRole('button', { name: '确认' }))
  await waitFor(() => expect(mocks.unlink).toHaveBeenCalledTimes(2))
  expect(mocks.unlink).toHaveBeenLastCalledWith({
    data: { userId: 'user-1', accountId: 'account-1' },
  })
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
})

it('blocks account changes when loading the target user fails', async () => {
  mocks.overview.mockRejectedValue(new Error('overview unavailable'))
  mount()
  await screen.findByRole('alert')
  expect(screen.getByLabelText('新密码')).toBeDisabled()
  expect(screen.getByRole('button', { name: '重置密码' })).toBeDisabled()
  expect(mocks.reset).not.toHaveBeenCalled()
})
