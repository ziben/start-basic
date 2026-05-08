import { Link } from '@tanstack/react-router'
import { AlertCircle, FileText, Loader2, Plus, Search } from 'lucide-react'
import { useDeferredValue, useState, type ReactElement } from 'react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useHealthReportsQuery } from '../../shared/hooks/use-health-reports'

export function HealthReportsPage(): ReactElement {
  const [filter, setFilter] = useState('')
  const deferredFilter = useDeferredValue(filter.trim())
  const { data, error, isFetching, isLoading } = useHealthReportsQuery({ filter: deferredFilter })
  const reports = data?.items ?? []

  return (
    <AppHeaderMain fixed>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">体检报告</h2>
          <p className="text-muted-foreground">管理 OCR 文本解析后的体检指标数据</p>
        </div>
        <Button asChild>
          <Link to="/health/reports/new">
            <Plus className="mr-2 h-4 w-4" />
            新建识别
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertTitle>报告列表加载失败</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : '请稍后重试'}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center text-base">
            <FileText className="mr-2 h-4 w-4" />
            报告列表
            {isFetching && <Loader2 className="text-muted-foreground ml-2 h-4 w-4 animate-spin" />}
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="搜索标题或文件名"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>体检日期</TableHead>
                <TableHead>指标数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-28 text-center">
                    正在加载体检报告...
                  </TableCell>
                </TableRow>
              )}
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{formatDate(report.examDate)}</TableCell>
                  <TableCell>{report.metricCount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatStatus(report.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/health/reports/$reportId" params={{ reportId: report.id }}>
                        查看
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-28 text-center">
                    暂无体检报告
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppHeaderMain>
  )
}

function formatDate(value: Date | string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('zh-CN')
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    OCR_TEXT_READY: '文本就绪',
    PARSED: '已解析',
    FAILED: '解析失败',
  }
  return labels[status] ?? status
}
