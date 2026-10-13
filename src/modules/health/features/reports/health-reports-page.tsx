import { useDeferredValue, useState, type ReactElement } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, FileText, Loader2, Plus, Search } from 'lucide-react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useHealthPersonsQuery } from '../../shared/hooks/use-health-persons'
import { useHealthReportsQuery, type HealthReportFilters } from '../../shared/hooks/use-health-reports'

export function HealthReportsPage(): ReactElement {
  const [filters, setFilters] = useState<HealthReportFilters>({ page: 1, pageSize: 10, filter: '' })
  const deferredFilters = useDeferredValue(filters)
  const { data, error, isFetching, isLoading } = useHealthReportsQuery(deferredFilters)
  const { data: persons = [], error: personsError } = useHealthPersonsQuery()
  const reports = data?.items ?? []
  const page = filters.page ?? 1
  const pageCount = data?.pageCount ?? 0
  const isUpdating = isFetching || filters !== deferredFilters

  return (
    <AppHeaderMain fixed>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>体检报告</h2>
          <p className='text-muted-foreground'>管理 OCR 文本解析后的体检指标数据</p>
        </div>
        <div className='flex gap-2'>
          <Button asChild variant='outline'>
            <Link to='/health/persons'>人员档案</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/health/compare'>跨期比较</Link>
          </Button>
          <Button asChild>
            <Link to='/health/reports/new'>
              <Plus className='mr-2 h-4 w-4' />
              新建识别
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle />
          <AlertTitle>报告列表加载失败</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : '请稍后重试'}</AlertDescription>
        </Alert>
      )}

      {personsError && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle />
          <AlertTitle>人员筛选加载失败</AlertTitle>
          <AlertDescription>{personsError instanceof Error ? personsError.message : '请稍后重试'}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className='gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle className='flex items-center text-base'>
            <FileText className='mr-2 h-4 w-4' />
            报告列表
            {isFetching && <Loader2 className='ml-2 h-4 w-4 animate-spin text-muted-foreground' />}
          </CardTitle>
          <div className='flex w-full flex-col gap-3 sm:flex-row lg:w-auto'>
            <div className='flex items-center gap-2'>
              <Label htmlFor='report-person-filter' className='shrink-0'>
                人员
              </Label>
              <select
                id='report-person-filter'
                value={filters.personId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, personId: event.target.value || undefined, page: 1 }))
                }
                className='h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm sm:w-40'
              >
                <option value=''>全部人员</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='relative w-full sm:w-72'>
              <Search className='absolute top-2.5 left-2 h-4 w-4 text-muted-foreground' />
              <Input
                aria-label='搜索报告'
                value={filters.filter ?? ''}
                onChange={(event) => setFilters((current) => ({ ...current, filter: event.target.value, page: 1 }))}
                placeholder='搜索标题或文件名'
                className='pl-8'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>人员</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>体检日期</TableHead>
                <TableHead>指标数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className='text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className='h-28 text-center text-muted-foreground'>
                    正在加载体检报告...
                  </TableCell>
                </TableRow>
              )}
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.person?.name ?? '未分配'}</TableCell>
                  <TableCell className='font-medium'>{report.title}</TableCell>
                  <TableCell>{formatDate(report.examDate)}</TableCell>
                  <TableCell>{report.metricCount}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{formatStatus(report.status)}</Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button asChild variant='ghost' size='sm'>
                      <Link to='/health/reports/$reportId' params={{ reportId: report.id }}>
                        查看
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !error && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-28 text-center text-muted-foreground'>
                    {filters.filter?.trim() || filters.personId ? '没有符合筛选条件的报告' : '暂无体检报告'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
            <div className='text-sm text-muted-foreground' role='status'>
              {data
                ? `共 ${data.total} 份报告，第 ${page} / ${Math.max(1, pageCount)} 页`
                : error
                  ? '报告数量加载失败'
                  : '正在加载报告数量...'}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Label htmlFor='report-page-size'>每页</Label>
              <select
                id='report-page-size'
                value={filters.pageSize}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))
                }
                className='h-9 rounded-md border border-input bg-background px-2 text-sm'
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} 条
                  </option>
                ))}
              </select>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1 || isUpdating}
                onClick={() => setFilters((current) => ({ ...current, page: page - 1 }))}
              >
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={!data || page >= pageCount || isUpdating}
                onClick={() => setFilters((current) => ({ ...current, page: page + 1 }))}
              >
                下一页
              </Button>
            </div>
          </div>
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
