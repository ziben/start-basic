import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileForm } from './profile-form'

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  invalidate: vi.fn(),
  invalidateQueries: vi.fn(),
}))
vi.mock('@/modules/auth/shared/lib/auth-client', () => ({ authClient: { updateUser: mocks.updateUser } }))
vi.mock('@/shared/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      name: '原始姓名',
      email: 'profile@example.com',
      image: 'https://example.com/old.png',
      emailVerified: true,
    },
  }),
}))
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }) }))
vi.mock('@tanstack/react-router', () => ({ useRouter: () => ({ invalidate: mocks.invalidate }) }))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.updateUser.mockResolvedValue({ data: { status: true }, error: null })
})

describe('个人资料编辑', () => {
  it('rejects a blank name and non-web avatar URL without submitting', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)
    await user.clear(screen.getByLabelText('显示名称'))
    await user.clear(screen.getByLabelText('头像地址'))
    await user.type(screen.getByLabelText('头像地址'), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: '保存资料' }))
    expect(await screen.findByText('请输入显示名称')).toBeVisible()
    expect(await screen.findByText('请输入以 https:// 或 http:// 开头的头像地址')).toBeVisible()
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it('keeps edits after a failed save, retries, and resets to the last saved values', async () => {
    mocks.updateUser.mockResolvedValueOnce({ error: { message: '服务暂不可用' } })
    const user = userEvent.setup()
    render(<ProfileForm />)
    const name = screen.getByLabelText('显示名称')
    const image = screen.getByLabelText('头像地址')
    await user.clear(name)
    await user.type(name, '新的姓名')
    await user.clear(image)
    await user.click(screen.getByRole('button', { name: '保存资料' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂不可用')
    expect(name).toHaveValue('新的姓名')
    await user.click(screen.getByRole('button', { name: '保存资料' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '保存资料' })).toBeDisabled())
    expect(mocks.updateUser).toHaveBeenLastCalledWith({ name: '新的姓名', image: null })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.type(name, '未保存内容')
    await user.click(screen.getByRole('button', { name: '撤销修改' }))
    expect(name).toHaveValue('新的姓名')
    expect(image).toHaveValue('')
    expect(screen.getByLabelText('登录邮箱')).toHaveAttribute('readonly')
  })
})
