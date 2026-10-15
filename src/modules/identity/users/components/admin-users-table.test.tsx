import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AdminUsersTable } from './admin-users-table'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../hooks/use-admin-users-list-query', () => ({ useAdminUsersListQuery: mocks.query }))
vi.mock('~/modules/admin/shared/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('./admin-users-columns', () => ({
  useAdminUsersColumns: () => [{ accessorKey: 'name' }, { accessorKey: 'email' }, { accessorKey: 'banned' }],
}))
vi.mock('./data-table-bulk-actions', () => ({ DataTableBulkActions: () => null }))
vi.mock('@/shared/hooks/use-table-column-visibility', () => ({
  useTableColumnVisibility: () => ({ columnVisibility: {}, setColumnVisibility: vi.fn() }),
}))
vi.mock('@tanstack/react-virtual', () => ({ useVirtualizer: () => ({}) }))
vi.mock('@/modules/admin/shared/components/admin-data-table', () => ({
  AdminDataTable: ({ table }: any) => (
    <div>
      <output data-testid='selected'>
        {table
          .getSelectedRowModel()
          .rows.map((row: any) => row.original.id)
          .join(',')}
      </output>
      {table.getRowModel().rows.map((row: any) => (
        <button key={row.id} disabled={!row.getCanSelect()} onClick={() => row.toggleSelected()}>
          {row.original.name}
        </button>
      ))}
      <button onClick={() => table.setPageIndex(1)}>Next page</button>
      <button onClick={() => table.setGlobalFilter('Bob')}>Filter</button>
      <button onClick={() => table.getColumn('email').toggleSorting(false)}>Sort email</button>
    </div>
  ),
}))

const navigate = vi.fn()
const result = (items = [{ id: 'user-1', name: 'Alice' }]) => ({
  data: items,
  pageData: { items, pageCount: 2 },
  serverPageCount: 2,
  isLoading: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
  isRefetching: false,
  error: null,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.query.mockReturnValue(result())
})
afterEach(cleanup)

it('does not move a selected user onto a different record after a list refresh', () => {
  const view = render(<AdminUsersTable search={{}} navigate={navigate} />)
  fireEvent.click(screen.getByRole('button', { name: 'Alice' }))
  expect(screen.getByTestId('selected')).toHaveTextContent('user-1')
  mocks.query.mockReturnValue(result([{ id: 'user-2', name: 'Bob' }]))
  view.rerender(<AdminUsersTable search={{}} navigate={navigate} />)
  expect(screen.getByTestId('selected')).toBeEmptyDOMElement()
})

it.each(['Next page', 'Filter'])('clears selection when using %s', (action) => {
  render(<AdminUsersTable search={{}} navigate={navigate} />)
  fireEvent.click(screen.getByRole('button', { name: 'Alice' }))
  fireEvent.click(screen.getByRole('button', { name: action }))
  expect(screen.getByTestId('selected')).toBeEmptyDOMElement()
  expect(navigate).toHaveBeenCalled()
})

it('sends restored sorting and ban filters to the server and persists new sorting in the URL', () => {
  render(<AdminUsersTable search={{ sortBy: 'name', sortDir: 'desc', banned: ['true'] }} navigate={navigate} />)
  expect(mocks.query).toHaveBeenLastCalledWith(
    expect.objectContaining({
      sorting: [{ id: 'name', desc: true }],
      banned: true,
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Sort email' }))
  const navigation = navigate.mock.lastCall?.[0]
  expect(navigation.search({ page: 2 })).toMatchObject({
    sortBy: 'email',
    sortDir: 'asc',
    page: undefined,
  })
})

it('does not reset the page before the server responds but resets an empty out-of-range page', () => {
  mocks.query.mockReturnValue({ ...result([]), pageData: undefined, serverPageCount: 0, isLoading: true })
  const view = render(<AdminUsersTable search={{ page: 5 }} navigate={navigate} />)
  expect(navigate).not.toHaveBeenCalled()
  mocks.query.mockReturnValue({ ...result([]), pageData: { items: [], pageCount: 0 }, serverPageCount: 0 })
  view.rerender(<AdminUsersTable search={{ page: 5 }} navigate={navigate} />)
  expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
})

it('blocks selection while displaying placeholder data from another page', () => {
  mocks.query.mockReturnValue({ ...result(), isPlaceholderData: true })
  render(<AdminUsersTable search={{ page: 2 }} navigate={navigate} />)
  expect(screen.getByRole('button', { name: 'Alice' })).toBeDisabled()
})
