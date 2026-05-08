import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Loader2 } from 'lucide-react'
import { FormEvent, useState, type ReactElement } from 'react'
import { toast } from 'sonner'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useCreateHealthReport } from '../../shared/hooks/use-health-reports'

const sampleText = `白细胞 6.21 10^9/L 3.5-9.5 正常
谷丙转氨酶 58 U/L 0-40 偏高
血红蛋白 118 g/L 130-175 偏低`

export function NewHealthReportPage(): ReactElement {
  const navigate = useNavigate()
  const createReport = useCreateHealthReport()
  const [title, setTitle] = useState('年度体检报告')
  const [examDate, setExamDate] = useState('')
  const [sourceFileName, setSourceFileName] = useState('')
  const [ocrText, setOcrText] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    try {
      const report = await createReport.mutateAsync({
        title,
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
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">新建体检识别</h2>
        <p className="text-muted-foreground">第一版使用手动粘贴 OCR 文本，后续可替换真实 OCR 服务</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <ClipboardList className="mr-2 h-4 w-4" />
            报告信息
          </CardTitle>
          <CardDescription>粘贴体检报告识别文本后，系统会解析指标并写入明细表</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">报告标题</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">体检日期</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceFileName">来源文件名</Label>
              <Input
                id="sourceFileName"
                value={sourceFileName}
                onChange={(event) => setSourceFileName(event.target.value)}
                placeholder="例如 2026体检报告.pdf"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ocrText">OCR 文本</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOcrText(sampleText)}>
                  填入示例
                </Button>
              </div>
              <Textarea
                id="ocrText"
                value={ocrText}
                onChange={(event) => setOcrText(event.target.value)}
                placeholder="每行一个指标，例如：白细胞 6.21 10^9/L 3.5-9.5 正常"
                className="min-h-60 font-mono text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => void navigate({ to: '/health/reports' })}>
                返回
              </Button>
              <Button type="submit" disabled={createReport.isPending}>
                {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                解析并入库
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppHeaderMain>
  )
}
