import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  filterFns,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable as useNativeTable,
} from '@tanstack/react-table'
import type {
  Column as CoreColumn,
  ColumnDef as CoreColumnDef,
  ColumnVisibilityState,
  FilterFn as CoreFilterFn,
  ReactTable,
  Row as CoreRow,
  RowData,
  TableOptions,
} from '@tanstack/react-table'

// Shared UI consumers use these capabilities. Each table adds only its own
// row-model stages so server pagination/filtering keep their existing ownership.
export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filterFns,
  sortFns,
})

export type DataTableFeatures = typeof dataTableFeatures
export type Table<TData extends RowData> = ReactTable<DataTableFeatures, TData>
export type Column<TData extends RowData, TValue = unknown> = CoreColumn<DataTableFeatures, TData, TValue>
export type ColumnDef<TData extends RowData, TValue = unknown> = CoreColumnDef<DataTableFeatures, TData, TValue>
export type Row<TData extends RowData> = CoreRow<DataTableFeatures, TData>

export function useTable<TData extends RowData>(options: TableOptions<DataTableFeatures, TData>): Table<TData> {
  return useNativeTable(options)
}

export {
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  tableFeatures,
} from '@tanstack/react-table'
export type {
  ColumnFiltersState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  SortingState,
  RowData,
} from '@tanstack/react-table'

export type VisibilityState = ColumnVisibilityState

export type FilterFn<TData extends RowData> = CoreFilterFn<DataTableFeatures, TData>
