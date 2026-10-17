import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bank } from '../shared/hooks'
import { BankManager } from './bank-manager'

const { command } = vi.hoisted(() => ({ command: { mutateAsync: vi.fn(), isPending: false } }))
vi.mock('../shared/hooks', () => ({ useQuestionBankCommand: () => command }))

const bank = {
  id: 'bank',
  name: '数学题库',
  scope: 'PERSONAL',
  ownerId: 'user',
  description: '',
  archived: false,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  knowledgePoints: [],
  _count: { questions: 0 },
} satisfies Bank

beforeEach(() => {
  vi.resetAllMocks()
  command.isPending = false
  command.mutateAsync.mockResolvedValue({ message: '题库已归档，已有试卷不受影响' })
})

describe('bank archive confirmation', () => {
  it('does not archive until the destructive action is confirmed', async () => {
    render(<BankManager banks={[bank]} scope='PERSONAL' onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /归档/ }))
    expect(command.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(command.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /归档/ }))
    fireEvent.click(screen.getByRole('button', { name: '确认归档' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(command.mutateAsync).toHaveBeenCalledExactlyOnceWith({ action: 'archiveBank', id: 'bank', version: 1 })
  })
  it('keeps a failed archive open and allows retrying the same bank', async () => {
    command.mutateAsync.mockRejectedValueOnce(new Error('Temporary failure'))
    render(<BankManager banks={[bank]} scope='PERSONAL' onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /归档/ }))
    fireEvent.click(screen.getByRole('button', { name: '确认归档' }))
    await waitFor(() => expect(command.mutateAsync).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('数学题库')
    fireEvent.click(screen.getByRole('button', { name: '确认归档' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(command.mutateAsync).toHaveBeenCalledTimes(2)
  })
})
