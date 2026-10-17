import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankQuestion } from '../shared/domain'
import { PaperEditor, type PaperDraft } from './paper-editor'

const { mutate, blocker, navigate } = vi.hoisted(() => ({ mutate: vi.fn(), blocker: vi.fn(), navigate: vi.fn() }))
vi.mock('../shared/hooks', () => ({
  bankQueryKey: ['question-bank'],
  useQuestionBankCommand: () => ({ mutateAsync: mutate, isPending: false }),
}))
vi.mock('../shared/server-fns/question-bank.fn', () => ({ getQuestionPaperFn: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate, useBlocker: blocker }))

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
  blocker.mockReturnValue({ status: 'idle' })
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
  it('requires confirmation to leave changed scores and keeps them when canceled', () => {
    const onCancel = vi.fn()
    render(<PaperEditor initial={draft()} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText('分值'), { target: { value: '3.25' } })
    fireEvent.click(screen.getByRole('button', { name: '返回题库' }))
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }))
    expect(screen.getByLabelText('分值')).toHaveValue(3.25)
    fireEvent.click(screen.getByRole('button', { name: '返回题库' }))
    fireEvent.click(screen.getByRole('button', { name: '放弃修改并离开' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
  it('guards newly appended questions before further edits and clears the guard after saving', async () => {
    const appended = draft()
    appended.sections[0].items[0].id = undefined
    render(<PaperEditor initial={appended} onCancel={() => {}} />)
    expect(blocker.mock.calls.at(-1)![0].shouldBlockFn()).toBe(true)
    expect(blocker.mock.calls.at(-1)![0].enableBeforeUnload()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '保存试卷' }))
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(blocker.mock.calls.at(-1)![0].shouldBlockFn()).toBe(false)
    expect(blocker.mock.calls.at(-1)![0].enableBeforeUnload()).toBe(false)
  })
  it('retains unsaved data and its guard after a failed save', async () => {
    mutate.mockRejectedValueOnce(new Error('Temporary failure'))
    render(<PaperEditor initial={draft()} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('试卷标题'), { target: { value: '未保存的新标题' } })
    fireEvent.click(screen.getByRole('button', { name: '保存试卷' }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    expect(screen.getByLabelText('试卷标题')).toHaveValue('未保存的新标题')
    expect(blocker.mock.calls.at(-1)![0].shouldBlockFn()).toBe(true)
    expect(navigate).not.toHaveBeenCalled()
  })
  it('preserves local edits when a background refetch returns another version', () => {
    const view = render(<PaperEditor initial={draft()} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('试卷标题'), { target: { value: '本地未保存的标题' } })
    view.rerender(<PaperEditor initial={{ ...draft(), version: 2, title: '另一个窗口的新标题' }} onCancel={() => {}} />)
    expect(screen.getByLabelText('试卷标题')).toHaveValue('本地未保存的标题')
    expect(screen.getByRole('alert')).toHaveTextContent('当前未保存内容已保留')
    fireEvent.click(screen.getByRole('button', { name: '保存试卷' }))
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ version: 1, title: '本地未保存的标题' }))
  })
  it('loads a newer server version when there are no local changes', () => {
    const view = render(<PaperEditor initial={draft()} onCancel={() => {}} />)
    view.rerender(<PaperEditor initial={{ ...draft(), version: 2, title: '最新标题' }} onCancel={() => {}} />)
    expect(screen.getByLabelText('试卷标题')).toHaveValue('最新标题')
    expect(blocker.mock.calls.at(-1)![0].shouldBlockFn()).toBe(false)
  })
})
