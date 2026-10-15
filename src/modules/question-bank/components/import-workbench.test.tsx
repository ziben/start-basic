import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankQuestion, questionContentSchema } from '../shared/domain'
import type { Bank } from '../shared/hooks'
import { ImportWorkbench } from './import-workbench'

const { preview, mutate } = vi.hoisted(() => ({ preview: vi.fn(), mutate: vi.fn() }))
vi.mock('../shared/server-fns/question-bank.fn', () => ({ previewQuestionImportFn: preview }))
vi.mock('../shared/hooks', () => ({ useQuestionBankCommand: () => ({ mutateAsync: mutate, isPending: false }) }))

const bank = {
  id: 'bank',
  name: '个人题库',
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
const content = questionContentSchema.parse({ ...blankQuestion(), stem: '示例题干', subject: '数学', answer: '2' })

beforeEach(() => {
  vi.resetAllMocks()
  preview.mockResolvedValue({
    totalCount: 2,
    valid: [{ row: 1, content }],
    ready: [{ row: 1, content }],
    errors: [{ row: 2, message: '题干不能为空' }],
    duplicates: [],
  })
  mutate.mockResolvedValue({ message: '导入成功' })
})

describe('import confirmation workflow', () => {
  it('previews without importing and only sends the confirmed source after a second action', async () => {
    render(<ImportWorkbench banks={[bank]} batches={[]} />)
    fireEvent.change(screen.getByLabelText('格式'), { target: { value: 'json' } })
    const source = JSON.stringify([content])
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: source } })
    fireEvent.click(screen.getByRole('button', { name: '校验并预览' }))
    await screen.findByText(/题干不能为空/)
    expect(mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认导入 1 道草稿' }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'confirmImport',
          bankId: 'bank',
          text: source,
          format: 'json',
          requestKey: expect.any(String),
        })
      )
    )
  })
  it('invalidates confirmation when the target or source changes', async () => {
    render(<ImportWorkbench banks={[bank]} batches={[]} />)
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: 'first' } })
    fireEvent.click(screen.getByRole('button', { name: '校验并预览' }))
    await screen.findByRole('button', { name: '确认导入 1 道草稿' })
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: 'changed' } })
    expect(screen.queryByRole('button', { name: /确认导入/ })).not.toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })
})
