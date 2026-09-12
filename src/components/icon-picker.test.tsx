import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IconPicker } from './icon-picker'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 6) }, (_, index) => {
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

    const input = screen.getByPlaceholderText('搜索图标...')
    await user.type(input, 'sparkles')

    await user.click(await screen.findByRole('button', { name: 'Sparkles' }))

    expect(onValueChange).toHaveBeenCalledWith('Sparkles')
    expect(screen.queryByPlaceholderText('搜索图标...')).not.toBeInTheDocument()
  })
})
