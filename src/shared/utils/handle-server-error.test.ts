import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { handleServerError } from './handle-server-error'

vi.mock('sonner', () => {
  return {
    toast: {
      error: vi.fn(),
    },
  }
})

describe('handleServerError', () => {
  it('does not throw', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    expect(() => handleServerError(new Error('boom'))).not.toThrow()
    spy.mockRestore()
  })

  it('shows default message for unknown error', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    handleServerError(new Error('boom'))
    expect(toast.error).toHaveBeenCalledWith('Something went wrong!')
    spy.mockRestore()
  })

  it('shows content not found when status is 204', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    handleServerError({ status: 204 })
    expect(toast.error).toHaveBeenCalledWith('Content not found.')
    spy.mockRestore()
  })

  it('prefers response.data.title when provided', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    handleServerError({ response: { data: { title: 'Bad Request' } } })
    expect(toast.error).toHaveBeenCalledWith('Bad Request')
    spy.mockRestore()
  })
})

