import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AdminNavItem } from '~/modules/navigation/shared/navitem/data/schema'
import type { ColumnDef } from '~/shared/lib/tanstack-table'
import AdminNavItemTable from './admin-navitem-table'

vi.mock('~/modules/admin/shared/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('./admin-navitem-columns', () => ({
  useAdminNavItemColumns: () => ({
    columns: [
      { accessorKey: 'navGroupId' },
      { accessorKey: 'orderIndex' },
      {
        accessorKey: 'title',
        cell: ({ row }) => (
          <>
            {row.getCanExpand() && (
              <button onClick={() => row.toggleExpanded()} aria-label='toggle parent'>
                {row.getIsExpanded() ? 'collapse' : 'expand'}
              </button>
            )}
            <span>{row.original.title}</span>
          </>
        ),
      },
    ] satisfies ColumnDef<AdminNavItem>[],
  }),
}))

const data: AdminNavItem[] = [
  {
    id: 'parent-id',
    title: 'Parent',
    url: null,
    orderIndex: 0,
    isCollapsible: true,
    navGroupId: 'group-id',
    parentId: null,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
  {
    id: 'child-id',
    title: 'Child',
    url: '/child',
    orderIndex: 0,
    isCollapsible: false,
    navGroupId: 'group-id',
    parentId: 'parent-id',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
]

describe('navigation tree on native V9', () => {
  it('reveals a matching child with its ancestors and preserves expansion after clearing search', async () => {
    const user = userEvent.setup()
    render(<AdminNavItemTable data={data} />)
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
    const search = screen.getByPlaceholderText('admin.navitem.search')
    await user.type(search, 'Child')
    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(screen.getByText('Parent')).toBeInTheDocument()
    await user.clear(search)
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('allows manual collapse during search and uses stable row IDs after data replacement', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AdminNavItemTable data={data} />)
    await user.type(screen.getByPlaceholderText('admin.navitem.search'), 'Child')
    await user.click(screen.getByRole('button', { name: 'toggle parent' }))
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
    rerender(<AdminNavItemTable data={data} />)
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
    rerender(<AdminNavItemTable data={[...data].reverse()} />)
    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(screen.getByText('Parent')).toBeInTheDocument()
  })
})
