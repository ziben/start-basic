import { FormEvent, useEffect, useState, type ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useCreateHealthPerson, useHealthPersonsQuery } from '../../shared/hooks/use-health-persons'
import { useCreateHealthReport, usePreviewHealthReport } from '../../shared/hooks/use-health-reports'
import type { HealthReportPreview } from '../../shared/services/health-report.service'

const sampleText = `白细胞 6.21 10^9/L 3.5-9.5 正常
谷丙转氨酶 58 U/L 0-40 偏高
血红蛋白 118 g/L 130-175 偏低`

export function NewHealthReportPage(): ReactElement {
  const navigate = useNavigate()
  const createReport = useCreateHealthReport()
  const createPerson = useCreateHealthPerson()
  const previewReport = usePreviewHealthReport()
  const { data: persons = [] } = useHealthPersonsQuery()
  const [title, setTitle] = useState('年度体检报告')
  const [personId, setPersonId] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [sourceFileName, setSourceFileName] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [preview, setPreview] = useState<HealthReportPreview | null>(null)
  const [previewedText, setPreviewedText] = useState('')
  const [acknowledgedSkipped, setAcknowledgedSkipped] = useState(false)

  const previewStale = preview !== null && previewedText !== ocrText
  const confirmDisabled =
    !preview ||
    previewStale ||
    (preview.skippedLines.length > 0 && !acknowledgedSkipped) ||
    createReport.isPending ||
    createPerson.isPending

  async function handlePreview(): Promise<void> {
    if (!ocrText.trim()) {
      toast.error('请先粘贴 OCR 文本')
      return
    }
    try {
      const result = await previewReport.mutateAsync({ ocrText, sourceFileName: sourceFileName || undefined })
      setPreview(result)
      setPreviewedText(ocrText)
      setAcknowledgedSkipped(false)
      if (result.metricCount === 0) {
        toast.error('未能从 OCR 文本中解析出体检指标，请检查文本格式')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解析预览失败')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (confirmDisabled) return

    try {
      let selectedPersonId = personId
      if (!selectedPersonId && newPersonName.trim()) {
        const person = await createPerson.mutateAsync({ name: newPersonName })
        selectedPersonId = person.id
        setPersonId(person.id)
        setNewPersonName('')
      }
      if (!selectedPersonId) {
        toast.error('请先选择或新建健康档案人员')
        return
      }

      const report = await createReport.mutateAsync({
        title,
        personId: selectedPersonId,
        examDate: examDate || undefined,
        sourceFileName: sourceFileName || undefined,
        ocrText,
      })
      toast.success('体检报告已入库')
      await navigate({ to: '/health/reports/$reportId', params: { reportId: report.id } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建体检报告失败')
    }
  }

  return (
    <AppHeaderMain fixed>
      <div className='mb-4'>
        <h2 className='text-2xl font-bold tracking-tight'>新建体检识别</h2>
        <p className='text-muted-foreground'>第一版使用手动粘贴 OCR 文本，后续可替换真实 OCR 服务</p>
      </div>

      <Card className='max-w-4xl'>
        <CardHeader>
          <CardTitle className='flex items-center text-base'>
            <ClipboardList className='mr-2 h-4 w-4' />
            报告信息
          </CardTitle>
          <CardDescription>粘贴体检报告识别文本后，系统会解析指标并写入明细表</CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='personId'>健康档案人员</Label>
                <select
                  id='personId'
                  value={personId}
                  onChange={(event) => setPersonId(event.target.value)}
                  className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                >
                  <option value=''>选择人员</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='newPersonName'>新建人员</Label>
                <Input
                  id='newPersonName'
                  value={newPersonName}
                  onChange={(event) => setNewPersonName(event.target.value)}
                  placeholder='没有人员时填写姓名'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='title'>报告标题</Label>
                <Input id='title' value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='examDate'>体检日期</Label>
                <Input
                  id='examDate'
                  type='date'
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='sourceFileName'>来源文件名</Label>
              <Input
                id='sourceFileName'
                value={sourceFileName}
                onChange={(event) => setSourceFileName(event.target.value)}
                placeholder='例如 2026体检报告.pdf'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='ocrText'>OCR 文本</Label>
                <Button type='button' variant='ghost' size='sm' onClick={() => setOcrText(sampleText)}>
                  填入示例
                </Button>
              </div>
              <Textarea
                id='ocrText'
                value={ocrText}
                onChange={(event) => setOcrText(event.target.value)}
                placeholder='每行一个指标，例如：白细胞 6.21 10^9/L 3.5-9.5 正常'
                className='min-h-60 font-mono text-sm'
                required
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => void navigate({ to: '/health/reports' })}>
                返回
              </Button>
              <Button
                type='button'
                variant='outline'
                disabled={previewReport.isPending}
                onClick={() => void handlePreview()}
              >
                {previewReport.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                解析预览
              </Button>
              <Button type='submit' disabled={confirmDisabled}>
                {(createReport.isPending || createPerson.isPending) && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                确认入库
              </Button>
            </div>
          </form>

          {preview && (
            <div className='mt-6 space-y-4 border-t pt-4' data-testid='parse-preview'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>解析预览</h3>
                <span className='text-sm text-muted-foreground'>共识别 {preview.metricCount} 项指标</span>
              </div>
              {previewStale && (
                <p className='text-sm text-amber-600 dark:text-amber-400'>
                  OCR 文本已修改，预览结果失效，请重新解析后再确认入库。
                </p>
              )}
              {preview.metrics.length > 0 && (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b text-left text-muted-foreground'>
                        <th className='py-1.5 pr-2 font-medium'>指标</th>
                        <th className='py-1.5 pr-2 font-medium'>原文</th>
                        <th className='py-1.5 pr-2 font-medium'>结果</th>
                        <th className='py-1.5 pr-2 font-medium'>单位</th>
                        <th className='py-1.5 pr-2 font-medium'>参考范围</th>
                        <th className='py-1.5 font-medium'>标记</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.metrics.map((metric) => (
                        <tr key={metric.rawLine} className='border-b last:border-b-0'>
                          <td className='py-1.5 pr-2'>{metric.rawName}</td>
                          <td className='py-1.5 pr-2 font-mono text-xs text-muted-foreground'>{metric.rawLine}</td>
                          <td className='py-1.5 pr-2'>{metric.valueText}</td>
                          <td className='py-1.5 pr-2'>{metric.unit ?? '-'}</td>
                          <td className='py-1.5 pr-2'>{metric.referenceRange ?? '-'}</td>
                          <td className='py-1.5'>{metric.flag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.skippedLines.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-sm text-amber-600 dark:text-amber-400'>
                    以下 {preview.skippedLines.length} 行未能解析，入库后将不包含这些内容：
                  </p>
                  <ul className='space-y-1'>
                    {preview.skippedLines.map((line) => (
                      <li key={line.rawLine} className='text-xs text-muted-foreground'>
                        <span className='mr-2'>{line.reason}</span>
                        <span className='font-mono'>{line.rawLine}</span>
                      </li>
                    ))}
                  </ul>
                  <label className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={acknowledgedSkipped}
                      onChange={(event) => setAcknowledgedSkipped(event.target.checked)}
                    />
                    我已确认上述无法解析的行可以遗漏
                  </label>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppHeaderMain>
  )
}
