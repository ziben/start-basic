import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankQuestion } from '../shared/domain'
import { PaperEditor, type PaperDraft } from './paper-editor'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('../shared/hooks', () => ({
  bankQueryKey: ['question-bank'],
  useQuestionBankCommand: () => ({ mutateAsync: mutate, isPending: false }),
}))
vi.mock('../shared/server-fns/question-bank.fn', () => ({ getQuestionPaperFn: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))

const draft = (): PaperDraft => ({
  id: 'paper',
  version: 1,
  title: '测试练习卷',
  instructions: '仔细作答',
  sections: [
    {
      title: '一、试题',
      items: [
        {
          id: 'item',
          questionId: 'q1',
          sourceBankName: '个人题库',
          score: 2.5,
          answerLines: 2,
          snapshot: {
            ...blankQuestion(),
            stem: '计算题干',
            subject: '数学',
            answer: '独立参考答案',
            explanation: '独立解析文字',
          },
        },
      ],
    },
  ],
})

beforeEach(() => {
  vi.resetAllMocks()
  mutate.mockResolvedValue({ id: 'paper', message: '已保存' })
})

describe('paper editor and print versions', () => {
  it('prints a student DOM without answers, then includes them only in the teacher version', () => {
    render(<PaperEditor initial={draft()} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '打印预览' }))
    const printArea = document.getElementById('qb-print')!
    expect(within(printArea).getByText('计算题干')).toBeInTheDocument()
    expect(printArea.textContent).not.toContain('独立参考答案')
    expect(printArea.textContent).not.toContain('独立解析文字')
    fireEvent.change(screen.getByLabelText('打印版本'), { target: { value: 'teacher' } })
    expect(printArea.textContent).toContain('独立参考答案')
    expect(printArea.textContent).toContain('独立解析文字')
  })
  it('requires saving changed scores before printing and strips snapshots from save requests', async () => {
    render(<PaperEditor initial={draft()} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '打印预览' }))
    expect(screen.getByRole('button', { name: '打印 / 另存 PDF' })).toBeEnabled()
    fireEvent.change(screen.getByLabelText('分值'), { target: { value: '3.25' } })
    expect(screen.getByRole('button', { name: '打印 / 另存 PDF' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '保存试卷' }))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'savePaper',
        id: 'paper',
        version: 1,
        sections: [{ title: '一、试题', items: [{ id: 'item', questionId: 'q1', score: 3.25, answerLines: 2 }] }],
      })
    )
  })
})
