import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountForm } from './account/account-form'
import { DisplayForm } from './display/display-form'
import { NotificationsForm } from './notifications/notifications-form'

vi.mock('@/shared/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      name: '示例用户',
      email: 'user@example.com',
      image: null,
      emailVerified: true,
    },
  }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode }) => <a href={props.to}>{props.children}</a>,
}))

afterEach(cleanup)

describe('设置页演示提交收敛', () => {
  it('账号页展示真实显示名称并指向个人资料入口，未接入字段标记未开放', () => {
    render(<AccountForm />)

    expect(screen.getByDisplayValue('示例用户')).toHaveAttribute('readonly')
    expect(screen.getByRole('link', { name: '前往修改' })).toHaveAttribute('href', '/settings')
    expect(screen.getAllByText('未开放')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /update|保存|提交/i })).not.toBeInTheDocument()
  })

  it('通知页不再提供可提交的演示操作', () => {
    render(<NotificationsForm />)

    expect(screen.getByText('未开放')).toBeVisible()
    expect(screen.queryByRole('button', { name: /update|保存|提交/i })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '所有新消息' })).toBeDisabled()
  })

  it('显示页不再提供可提交的演示操作', () => {
    render(<DisplayForm />)

    expect(screen.getByText('未开放')).toBeVisible()
    expect(screen.queryByRole('button', { name: /update|保存|提交/i })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '最近访问' })).toBeDisabled()
  })
})
