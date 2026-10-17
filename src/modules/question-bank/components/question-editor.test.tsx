import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bank } from '../shared/hooks'
import { QuestionEditor } from './question-editor'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('../shared/hooks', () => ({ useQuestionBankCommand: () => ({ mutateAsync: mutate, isPending: false }) }))
vi.mock('@tanstack/react-router', () => ({ useBlocker: () => ({ status: 'idle' }) }))

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
  mutate.mockResolvedValue({ id: 'q', message: '已保存' })
})

describe('manual question entry', () => {
  it('keeps manually entered content until discarding it is confirmed', () => {
    const onCancel = vi.fn()
    render(<QuestionEditor banks={[bank]} initialBankId='bank' onSaved={() => {}} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText('题干'), { target: { value: '保留这道未保存的题目' } })
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }))
    expect(screen.getByLabelText('题干')).toHaveValue('保留这道未保存的题目')
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    fireEvent.click(screen.getByRole('button', { name: '放弃修改并离开' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
  it('saves entered content, classification and usable state through the authenticated command', async () => {
    const onSaved = vi.fn()
    render(<QuestionEditor banks={[bank]} initialBankId='bank' onSaved={onSaved} onCancel={() => {}} />)
    expect(screen.getByRole('combobox', { name: '所属题库' })).toHaveValue('bank')
    expect(screen.getByRole('combobox', { name: '题型' })).toHaveValue('SHORT')
    fireEvent.change(screen.getByLabelText('学科'), { target: { value: '数学' } })
    fireEvent.change(screen.getByLabelText('题干'), { target: { value: '求 2+3 的值' } })
    fireEvent.change(screen.getByLabelText('参考答案'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('知识点（多个名称用逗号分隔）'), { target: { value: '加法，运算' } })
    fireEvent.change(screen.getByLabelText('状态'), { target: { value: 'READY' } })
    fireEvent.click(screen.getByRole('button', { name: '保存题目' }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'saveQuestion',
        bankId: 'bank',
        status: 'READY',
        content: expect.objectContaining({
          stem: '求 2+3 的值',
          answer: '5',
          subject: '数学',
          knowledgePoints: ['加法', '运算'],
        }),
      })
    )
  })
  it('does not submit an incomplete composite and retains the editor for correction', async () => {
    render(<QuestionEditor banks={[bank]} initialBankId='bank' onSaved={() => {}} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('学科'), { target: { value: '语文' } })
    fireEvent.change(screen.getByLabelText('题型'), { target: { value: 'COMPOSITE' } })
    fireEvent.change(screen.getByLabelText('共用材料'), { target: { value: '阅读材料' } })
    fireEvent.click(screen.getByRole('button', { name: '保存题目' }))
    expect(screen.getByRole('alert')).toHaveTextContent('至少需要一道小题')
    expect(mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '添加小题' }))
    expect(screen.getByLabelText('小题题干')).toBeInTheDocument()
  })
})
