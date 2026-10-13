import { useState } from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable } from '~/components/data-table/data-table'
import {
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  dataTableFeatures,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
} from './tanstack-table'

type Item = { id: string; name: string; category: string; children?: Item[] }
const data: Item[] = [
  { id: 'c', name: 'Charlie', category: 'B' },
  { id: 'a', name: 'Alpha', category: 'A' },
  { id: 'b', name: 'Bravo', category: 'A' },
]
const columns: ColumnDef<Item>[] = [{ accessorKey: 'name' }, { accessorKey: 'category' }]
const features = tableFeatures({
  ...dataTableFeatures,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
})

describe('native V9 data tables', () => {
  it('sorts, filters, facets and paginates client data', () => {
    const { result } = renderHook(() =>
      useTable({ features, data, columns, initialState: { pagination: { pageIndex: 0, pageSize: 2 } } })
    )
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['c', 'a'])
    act(() => result.current.setSorting([{ id: 'name', desc: false }]))
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['a', 'b'])
    act(() => result.current.nextPage())
    expect(result.current.state.pagination.pageIndex).toBe(1)
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['c'])
    act(() => {
      result.current.setPageIndex(0)
      result.current.getColumn('category')!.setFilterValue('A')
    })
    expect(result.current.getFilteredRowModel().rows.map((row) => row.original.id)).toEqual(['a', 'b'])
    expect(result.current.getColumn('category')!.getFacetedUniqueValues().get('A')).toBe(2)
    act(() => result.current.setGlobalFilter('Bravo'))
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['b'])
  })

  it('does not reprocess server data and propagates controlled pagination', () => {
    const { result, rerender } = renderHook(
      ({ rows }) => {
        const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 1 })
        return useTable({
          features,
          columns,
          data: rows,
          pageCount: 4,
          manualPagination: true,
          manualFiltering: true,
          manualSorting: true,
          state: { pagination },
          onPaginationChange: setPagination,
        })
      },
      { initialProps: { rows: data } }
    )
    act(() => {
      result.current.setGlobalFilter('missing')
      result.current.setSorting([{ id: 'name', desc: false }])
      result.current.nextPage()
    })
    expect(result.current.state.pagination.pageIndex).toBe(1)
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['c', 'a', 'b'])
    rerender({ rows: [data[1]] })
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['a'])
  })

  it('expands trees and keeps row selection and column visibility reactive', () => {
    const tree: Item[] = [{ ...data[0], children: [data[1]] }]
    const { result } = renderHook(() =>
      useTable({ features, data: tree, columns, getRowId: (row) => row.id, getSubRows: (row) => row.children })
    )
    expect(result.current.getRowModel().rows).toHaveLength(1)
    act(() => result.current.getRow('c').toggleExpanded())
    expect(result.current.getRowModel().rows.map((row) => row.original.id)).toEqual(['c', 'a'])
    act(() => result.current.getRow('a').toggleSelected())
    expect(result.current.state.rowSelection.a).toBe(true)
    expect(result.current.getIsSomeRowsSelected()).toBe(true)
    expect(result.current.getIsAllRowsSelected()).toBe(false)
    act(() => result.current.toggleAllRowsSelected(true))
    expect(result.current.getIsSomeRowsSelected()).toBe(true)
    expect(result.current.getIsAllRowsSelected()).toBe(true)
    act(() => result.current.getColumn('category')!.toggleVisibility(false))
    expect(result.current.getVisibleLeafColumns().map((column) => column.id)).toEqual(['name'])
  })

  it('refreshes rendered cells after selection, visibility and data replacement', () => {
    let table: ReturnType<typeof useTable<Item>>
    function Fixture({ rows }: { rows: Item[] }) {
      table = useTable({ features, columns, data: rows, getRowId: (row) => row.id })
      return <DataTable table={table} columnsLength={columns.length} />
    }
    const { rerender } = render(<Fixture rows={data} />)
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    act(() => table.getRow('c').toggleSelected())
    expect(screen.getByText('Charlie').closest('tr')).toHaveAttribute('data-state', 'selected')
    act(() => table.getColumn('category')!.toggleVisibility(false))
    expect(screen.queryByText('B')).not.toBeInTheDocument()
    rerender(<Fixture rows={[{ ...data[0], name: 'Updated' }]} />)
    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })
})
