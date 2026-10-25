import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileProfilePage } from './profile-page'

interface MockUser {
    name: string
    email: string
    image: string | null
    role: string
}

const mocks = vi.hoisted(() => ({
    user: {
        name: '张三',
        email: 'zhang@example.com',
        image: null,
        role: 'user',
    } as MockUser | null,
    signOut: vi.fn(),
    invalidate: vi.fn(),
    navigate: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
}))

vi.mock('@/shared/context/auth-context', () => ({
    useAuth: () => ({ user: mocks.user }),
}))

vi.mock('@tanstack/react-router', () => ({
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode } & Record<string, unknown>) => (
        <a href={to} {...rest}>{children}</a>
    ),
    useNavigate: () => mocks.navigate,
    useRouter: () => ({ invalidate: mocks.invalidate }),
}))

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        setQueryData: mocks.setQueryData,
        invalidateQueries: mocks.invalidateQueries,
    }),
}))

vi.mock('@/modules/auth/shared/lib/auth-client', () => ({
    authClient: { signOut: mocks.signOut },
}))

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}))

beforeEach(() => {
    vi.clearAllMocks()
    mocks.user = {
        name: '张三',
        email: 'zhang@example.com',
        image: null,
        role: 'user',
    }
    mocks.signOut.mockResolvedValue(undefined)
    mocks.invalidate.mockResolvedValue(undefined)
})

describe('mobile profile page', () => {
    it('不展示无真实来源的积分、订单、收藏统计', () => {
        render(<MobileProfilePage />)
        expect(screen.queryByText('积分')).not.toBeInTheDocument()
        expect(screen.queryByText('1,240')).not.toBeInTheDocument()
        expect(screen.queryByText('订单')).not.toBeInTheDocument()
        expect(screen.queryByText('收藏')).not.toBeInTheDocument()
    })

    it('设置入口指向现有设置页', () => {
        render(<MobileProfilePage />)
        expect(screen.getByRole('link', { name: '设置' })).toHaveAttribute('href', '/settings')
    })

    it('不再渲染无实际跳转的菜单项', () => {
        render(<MobileProfilePage />)
        expect(screen.queryByText('我的钱包')).not.toBeInTheDocument()
        expect(screen.queryByText('账号安全')).not.toBeInTheDocument()
    })

    it('退出登录沿用原有逻辑', async () => {
        render(<MobileProfilePage />)
        await userEvent.click(screen.getByRole('button', { name: /退出登录/ }))
        await waitFor(() => expect(mocks.signOut).toHaveBeenCalled())
        expect(mocks.setQueryData).toHaveBeenCalledTimes(2)
        expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2)
        expect(mocks.navigate).toHaveBeenCalledWith({ to: '/m' })
    })

    it('未登录时提示前往登录', () => {
        mocks.user = null
        render(<MobileProfilePage />)
        expect(screen.getByText('尚未登录')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '前往登录' })).toBeInTheDocument()
    })
})
