import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewHealthReportPage } from './new-health-report-page'

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  createReport: vi.fn(),
  createPerson: vi.fn(),
  navigate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('../../shared/hooks/use-health-persons', () => ({
  useHealthPersonsQuery: () => ({ data: [{ id: 'person-1', name: '本人' }] }),
  useCreateHealthPerson: () => ({ mutateAsync: mocks.createPerson, isPending: false }),
}))
vi.mock('../../shared/hooks/use-health-reports', () => ({
  useCreateHealthReport: () => ({ mutateAsync: mocks.createReport, isPending: false }),
  usePreviewHealthReport: () => ({ mutateAsync: mocks.preview, isPending: false }),
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.navigate.mockResolvedValue(undefined)
})

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('健康档案人员'), 'person-1')
  await user.type(screen.getByLabelText('OCR 文本'), '白细胞 6.21 10^9/L 3.5-9.5 正常')
}

describe('新建体检识别的预览确认流程', () => {
  it('shows parsed metrics and skipped lines, and requires explicit acknowledgement before saving', async () => {
    mocks.preview.mockResolvedValue({
      metricCount: 1,
      metrics: [
        {
          rawName: '白细胞',
          rawLine: '白细胞 6.21 10^9/L 3.5-9.5 正常',
          valueText: '6.21',
          unit: '10^9/L',
          referenceRange: '3.5-9.5',
          flag: '正常',
        },
      ],
      skippedLines: [{ rawLine: '体检结论：未见异常', reason: '非指标行' }],
    })
    const user = userEvent.setup()
    render(<NewHealthReportPage />)
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: '解析预览' }))
    expect(mocks.preview).toHaveBeenCalledTimes(1)
    expect(mocks.preview.mock.calls[0][0].ocrText).toContain('白细胞')
    expect(await screen.findByText('共识别 1 项指标')).toBeVisible()
    expect(screen.getByText('体检结论：未见异常')).toBeVisible()
    const confirm = screen.getByRole('button', { name: '确认入库' })
    expect(confirm).toBeDisabled()
    await user.click(screen.getByLabelText('我已确认上述无法解析的行可以遗漏'))
    expect(confirm).toBeEnabled()

    mocks.createReport.mockResolvedValue({ id: 'report-1' })
    await user.click(confirm)
    await waitFor(() =>
      expect(mocks.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ ocrText: expect.stringContaining('白细胞'), personId: 'person-1' })
      )
    )
  })

  it('invalidates the preview when the raw text changes after parsing', async () => {
    mocks.preview.mockResolvedValue({ metricCount: 1, metrics: [], skippedLines: [] })
    const user = userEvent.setup()
    render(<NewHealthReportPage />)
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: '解析预览' }))
    await screen.findByText('共识别 1 项指标')

    await user.type(screen.getByLabelText('OCR 文本'), '血红蛋白 118 g/L')
    expect(screen.getByText(/预览结果失效/)).toBeVisible()
    expect(screen.getByRole('button', { name: '确认入库' })).toBeDisabled()
    expect(mocks.createReport).not.toHaveBeenCalled()
  })

  it('keeps the raw text and person selection after a failed save for a safe retry', async () => {
    mocks.preview.mockResolvedValue({ metricCount: 1, metrics: [], skippedLines: [] })
    const user = userEvent.setup()
    render(<NewHealthReportPage />)
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: '解析预览' }))
    await screen.findByText('共识别 1 项指标')

    mocks.createReport.mockRejectedValue(new Error('服务暂不可用'))
    await user.click(screen.getByRole('button', { name: '确认入库' }))
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('服务暂不可用'))

    const textarea = screen.getByLabelText('OCR 文本') as HTMLTextAreaElement
    expect(textarea.value).toContain('白细胞')
    expect(screen.getByLabelText('健康档案人员')).toHaveValue('person-1')
    expect(screen.getByRole('button', { name: '解析预览' })).toBeEnabled()
  })
})
