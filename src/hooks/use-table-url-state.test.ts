import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableUrlState, type NavigateFn } from './use-table-url-state'

describe('useTableUrlState', () => {
  it('derives initial pagination/globalFilter/columnFilters from search', () => {
    const navigate: NavigateFn = vi.fn()
    const { result } = renderHook(() =>
      useTableUrlState({
        search: { page: 3, pageSize: 20, filter: 'abc', title: 'hello' },
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
        globalFilter: { enabled: true, key: 'filter' },
        columnFilters: [{ columnId: 'title', searchKey: 'title', type: 'string' }],
      })
    )

    expect(result.current.pagination).toEqual({ pageIndex: 2, pageSize: 20 })
    expect(result.current.globalFilter).toBe('abc')
    expect(result.current.columnFilters).toEqual([{ id: 'title', value: 'hello' }])
  })

  it('onPaginationChange updates search via navigate', () => {
    const navigate: NavigateFn = vi.fn()
    const { result } = renderHook(() =>
      useTableUrlState({
        search: { page: 2, pageSize: 20 },
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
      })
    )

    act(() => {
      result.current.onPaginationChange({ pageIndex: 0, pageSize: 20 })
    })

    expect(navigate).toHaveBeenCalledTimes(1)
    const call = (navigate as any).mock.calls[0]![0]
    expect(typeof call.search).toBe('function')
    const patched = call.search({ page: 2, pageSize: 20 })
    expect(patched.page).toBeUndefined()
    expect(patched.pageSize).toBe(20)
  })

  it('onGlobalFilterChange trims and resets page', () => {
    const navigate: NavigateFn = vi.fn()
    const { result } = renderHook(() =>
      useTableUrlState({
        search: { page: 2, pageSize: 10, filter: '' },
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
        globalFilter: { enabled: true, key: 'filter', trim: true },
      })
    )

    act(() => {
      result.current.onGlobalFilterChange?.('  hi  ')
    })

    const call = (navigate as any).mock.calls[0]![0]
    const patched = call.search({ page: 2, pageSize: 10, filter: '' })
    expect(patched.page).toBeUndefined()
    expect(patched.filter).toBe('hi')
  })

  it('ensurePageInRange resets to first page by default', () => {
    const navigate: NavigateFn = vi.fn()
    const { result } = renderHook(() =>
      useTableUrlState({
        search: { page: 10 },
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
      })
    )

    act(() => {
      result.current.ensurePageInRange(3)
    })

    const call = (navigate as any).mock.calls[0]![0]
    expect(call.replace).toBe(true)
    const patched = call.search({ page: 10 })
    expect(patched.page).toBeUndefined()
  })
})
