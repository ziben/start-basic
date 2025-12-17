import { describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconPicker } from './icon-picker'

describe('IconPicker', () => {
  it('filters and selects an icon', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const onValueChange = vi.fn()
    render(<IconPicker onValueChange={onValueChange} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('显示前 300 个图标，使用搜索查找更多...')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('搜索图标...')
    await user.type(input, 'sparkles')

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    const sparklesBtn = await screen.findByRole('button', { name: 'Sparkles' })
    await user.click(sparklesBtn)

    expect(onValueChange).toHaveBeenCalledWith('Sparkles')
    expect(screen.queryByPlaceholderText('搜索图标...')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
