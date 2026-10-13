import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthReportFilters } from '../../shared/hooks/use-health-reports'
import { HealthReportsPage } from './health-reports-page'

const mocks = vi.hoisted(() => ({
  reportsQuery: vi.fn(),
  error: null as Error | null,
  isFetching: false,
  total: 25,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))
vi.mock('~/components/layout/app-header-main', () => ({
  AppHeaderMain: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))
vi.mock('../../shared/hooks/use-health-persons', () => ({
  useHealthPersonsQuery: () => ({ data: [{ id: 'person-1', name: '本人' }], error: null }),
}))
vi.mock('../../shared/hooks/use-health-reports', () => ({
  useHealthReportsQuery: (filters: HealthReportFilters) => {
    mocks.reportsQuery(filters)
    return {
      data: mocks.error
        ? undefined
        : {
            items: [],
            total: mocks.total,
            page: filters.page,
            pageSize: filters.pageSize,
            pageCount: Math.ceil(mocks.total / (filters.pageSize ?? 10)),
          },
      error: mocks.error,
      isFetching: mocks.isFetching,
      isLoading: false,
    }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.error = null
  mocks.isFetching = false
  mocks.total = 25
})

describe('health report list controls', () => {
  it('requests successive pages and prevents navigation beyond the last page', async () => {
    const user = userEvent.setup()
    render(<HealthReportsPage />)
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({ page: 2, pageSize: 10, filter: '' })
    expect(screen.getByRole('status')).toHaveTextContent('共 25 份报告，第 2 / 3 页')
    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '上一页' }))
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({ page: 2, pageSize: 10, filter: '' })
  })

  it('resets to the first page when search changes', async () => {
    const user = userEvent.setup()
    render(<HealthReportsPage />)
    await user.click(screen.getByRole('button', { name: '下一页' }))
    await user.type(screen.getByRole('textbox', { name: '搜索报告' }), '年度')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, filter: '年度' })
    expect(screen.getByText('没有符合筛选条件的报告')).toBeInTheDocument()
  })

  it('resets pagination for person and page-size changes and can clear the person filter', async () => {
    const user = userEvent.setup()
    render(<HealthReportsPage />)
    await user.click(screen.getByRole('button', { name: '下一页' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '人员' }), 'person-1')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      filter: '',
      personId: 'person-1',
    })
    await user.click(screen.getByRole('button', { name: '下一页' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '每页' }), '20')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filter: '',
      personId: 'person-1',
    })
    await user.selectOptions(screen.getByRole('combobox', { name: '人员' }), '')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filter: '',
      personId: undefined,
    })
  })

  it('disables pagination during fetching and for an empty list', () => {
    mocks.isFetching = true
    const { rerender } = render(<HealthReportsPage />)
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    mocks.isFetching = false
    mocks.total = 0
    rerender(<HealthReportsPage />)
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('共 0 份报告，第 1 / 1 页')
  })

  it('shows a query failure without claiming the list is empty', () => {
    mocks.error = new Error('服务暂不可用')
    render(<HealthReportsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('服务暂不可用')
    expect(screen.getByRole('status')).toHaveTextContent('报告数量加载失败')
    expect(screen.queryByText('暂无体检报告')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
  })
})
