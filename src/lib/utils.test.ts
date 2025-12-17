import { describe, expect, it } from 'vitest'
import { getPageNumbers } from './utils'

describe('getPageNumbers', () => {
  it('returns all pages when totalPages <= 5', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPageNumbers(3, 4)).toEqual([1, 2, 3, 4])
  })

  it('returns beginning range with ellipsis', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, '...', 10])
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, '...', 10])
  })

  it('returns middle range with ellipsis', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
  })

  it('returns end range with ellipsis', () => {
    expect(getPageNumbers(9, 10)).toEqual([1, '...', 7, 8, 9, 10])
    expect(getPageNumbers(10, 10)).toEqual([1, '...', 7, 8, 9, 10])
  })
})
