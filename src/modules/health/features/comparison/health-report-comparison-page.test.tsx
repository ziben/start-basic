import type { ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthReportFilters } from '../../shared/hooks/use-health-reports'
import { HealthReportComparisonPage } from './health-report-comparison-page'

const mocks = vi.hoisted(() => ({
  persons: [] as { id: string; name: string }[],
  reportsQuery: vi.fn(),
  comparisonQuery: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))
vi.mock('~/components/layout/app-header-main', () => ({
  AppHeaderMain: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))
vi.mock('../../shared/hooks/use-health-persons', () => ({
  useHealthPersonsQuery: () => ({ data: mocks.persons }),
}))
vi.mock('../../shared/hooks/use-health-reports', () => ({
  useHealthReportsQuery: (filters: HealthReportFilters) => {
    mocks.reportsQuery(filters)
    return {
      data: {
        items: ['earlier', 'later'].map((period) => ({
          id: `${filters.personId}-${period}`,
          title: period,
          examDate: null,
        })),
      },
      isLoading: false,
    }
  },
  useCompareHealthReportsQuery: (leftReportId: string, rightReportId: string) => {
    mocks.comparisonQuery(leftReportId, rightReportId)
    return {}
  },
}))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.persons = []
})

describe('health report comparison selection', () => {
  it('selects the first person when the persons query finishes loading', () => {
    const { rerender } = render(<HealthReportComparisonPage />)
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('')

    mocks.persons = [
      { id: 'person-1', name: 'First person' },
      { id: 'person-2', name: 'Second person' },
    ]
    rerender(<HealthReportComparisonPage />)

    expect(screen.getAllByRole('combobox')[0]).toHaveValue('person-1')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({ personId: 'person-1', pageSize: 50 })
    expect(mocks.comparisonQuery).toHaveBeenLastCalledWith('', '')
  })

  it('clears both report selections before comparing reports for a different person', async () => {
    mocks.persons = [
      { id: 'person-1', name: 'First person' },
      { id: 'person-2', name: 'Second person' },
    ]
    const user = userEvent.setup()
    render(<HealthReportComparisonPage />)
    const [personSelect, leftSelect, rightSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(leftSelect, 'person-1-earlier')
    await user.selectOptions(rightSelect, 'person-1-later')
    expect(mocks.comparisonQuery).toHaveBeenLastCalledWith('person-1-earlier', 'person-1-later')

    mocks.comparisonQuery.mockClear()
    await user.selectOptions(personSelect, 'person-2')

    expect(personSelect).toHaveValue('person-2')
    expect(leftSelect).toHaveValue('')
    expect(rightSelect).toHaveValue('')
    expect(mocks.reportsQuery).toHaveBeenLastCalledWith({ personId: 'person-2', pageSize: 50 })
    expect(mocks.comparisonQuery.mock.calls.every(([left, right]) => left === '' && right === '')).toBe(true)

    await user.selectOptions(leftSelect, 'person-2-earlier')
    await user.selectOptions(rightSelect, 'person-2-later')
    expect(mocks.comparisonQuery).toHaveBeenLastCalledWith('person-2-earlier', 'person-2-later')
  })

  it('does not compare the previous reports when a query refresh changes the default person', async () => {
    mocks.persons = [{ id: 'person-1', name: 'First person' }]
    const user = userEvent.setup()
    const { rerender } = render(<HealthReportComparisonPage />)
    const [personSelect, leftSelect, rightSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(leftSelect, 'person-1-earlier')
    await user.selectOptions(rightSelect, 'person-1-later')

    mocks.persons = [{ id: 'person-2', name: 'Second person' }]
    rerender(<HealthReportComparisonPage />)

    expect(personSelect).toHaveValue('person-2')
    expect(leftSelect).toHaveValue('')
    expect(rightSelect).toHaveValue('')
    expect(mocks.comparisonQuery).toHaveBeenLastCalledWith('', '')
  })
})
