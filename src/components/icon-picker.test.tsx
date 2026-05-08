import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IconPicker } from './icon-picker'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => {
        const size = estimateSize()
        const start = index * size
        return {
          index,
          key: index,
          start,
          size,
          end: start + size,
        }
      }),
    getTotalSize: () => count * estimateSize(),
  }),
}))

describe('IconPicker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters and selects an icon', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          width: 320,
          height: 300,
          top: 0,
          left: 0,
          right: 320,
          bottom: 300,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    )
    const user = userEvent.setup()

    const onValueChange = vi.fn()
    render(<IconPicker onValueChange={onValueChange} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('显示前 300 个图标，使用搜索查找更多...')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('搜索图标...')
    await user.type(input, 'sparkles')

    const sparklesLabel = await screen.findByText('Sparkles')
    const sparklesBtn = sparklesLabel.closest('button')
    if (!sparklesBtn) {
      throw new Error('Sparkles button not found')
    }
    await user.click(sparklesBtn)

    expect(onValueChange).toHaveBeenCalledWith('Sparkles')
    expect(screen.queryByPlaceholderText('搜索图标...')).not.toBeInTheDocument()
  })
})
