import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
const outcome = { totalCount: 1, ready: [{ row: 1, content }], errors: [], duplicates: [] }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

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
  it('ignores a late preview after the source changes', async () => {
    const pending = deferred<typeof outcome>()
    preview.mockReturnValueOnce(pending.promise)
    render(<ImportWorkbench banks={[bank]} batches={[]} />)
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: 'old source' } })
    fireEvent.click(screen.getByRole('button', { name: '校验并预览' }))
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: 'new source' } })
    await act(async () => pending.resolve(outcome))
    expect(screen.queryByRole('button', { name: /确认导入/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/文件内容/)).toHaveValue('new source')
    expect(screen.getByRole('button', { name: '校验并预览' })).toBeEnabled()
  })
  it('does not let a slow file read overwrite the latest file', async () => {
    const slow = deferred<string>()
    const first = Object.assign(new File(['first'], 'first.csv'), { text: () => slow.promise })
    const second = Object.assign(new File(['second'], 'second.json'), { text: async () => 'latest contents' })
    render(<ImportWorkbench banks={[bank]} batches={[]} />)
    fireEvent.change(screen.getByLabelText('上传文件'), { target: { files: [first] } })
    expect(screen.getByRole('button', { name: '正在读取文件…' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('上传文件'), { target: { files: [second] } })
    await waitFor(() => expect(screen.getByLabelText(/文件内容/)).toHaveValue('latest contents'))
    await act(async () => slow.resolve('outdated contents'))
    expect(screen.getByLabelText('文件内容：second.json')).toHaveValue('latest contents')
    expect(screen.getByLabelText('格式')).toHaveValue('json')
  })
  it('retries a failed confirmation with the same source and request key', async () => {
    mutate.mockRejectedValueOnce(new Error('Temporary failure'))
    render(<ImportWorkbench banks={[bank]} batches={[]} />)
    fireEvent.change(screen.getByLabelText(/文件内容/), { target: { value: 'confirmed contents' } })
    fireEvent.click(screen.getByRole('button', { name: '校验并预览' }))
    fireEvent.click(await screen.findByRole('button', { name: '确认导入 1 道草稿' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '确认导入 1 道草稿' }))
    await waitFor(() => expect(screen.getByLabelText(/文件内容/)).toHaveValue(''))
    expect(mutate.mock.calls[1][0]).toEqual(mutate.mock.calls[0][0])
  })
})
