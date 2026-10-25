import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileHomePage } from './homepage'

const mocks = vi.hoisted(() => ({
    user: null as { name: string; email: string } | null,
}))

vi.mock('@/shared/context/auth-context', () => ({
    useAuth: () => ({ user: mocks.user }),
}))

// Link 渲染为带 href 的 <a>，便于断言入口目标（含 search 参数）
vi.mock('@tanstack/react-router', () => ({
    Link: ({ to, search, children, ...rest }: { to: string; search?: { view?: string }; children: React.ReactNode } & Record<string, unknown>) => (
        <a href={search?.view ? `${to}?view=${search.view}` : to} {...rest}>{children}</a>
    ),
}))

beforeEach(() => {
    mocks.user = { name: '张三', email: 'zhang@example.com' }
})

describe('mobile home page', () => {
    it('渲染题库、我的试卷、健康档案、体检报告四个入口', () => {
        render(<MobileHomePage />)
        const entries: Array<[RegExp, string]> = [
            [/题库工作台/, '/question-bank'],
            [/我的试卷/, '/question-bank?view=papers'],
            [/健康档案/, '/health/persons'],
            [/体检报告/, '/health/reports'],
        ]
        for (const [name, href] of entries) {
            expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
        }
    })

    it('不再展示模板宣传内容', () => {
        render(<MobileHomePage />)
        expect(screen.queryByText(/Antigravity/)).not.toBeInTheDocument()
        expect(screen.queryByText(/微信生态集成/)).not.toBeInTheDocument()
        expect(screen.queryByText(/现代美学|丝滑交互/)).not.toBeInTheDocument()
    })

    it('未登录时提供前往登录入口', () => {
        mocks.user = null
        render(<MobileHomePage />)
        expect(screen.getByRole('link', { name: /前往登录/ })).toHaveAttribute('href', '/m/login')
    })
})
