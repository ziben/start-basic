import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, GitCompareArrows, Loader2 } from 'lucide-react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useHealthPersonsQuery } from '../../shared/hooks/use-health-persons'
import { useCompareHealthReportsQuery, useHealthReportsQuery } from '../../shared/hooks/use-health-reports'

export function HealthReportComparisonPage(): ReactElement {
  const { data: persons = [] } = useHealthPersonsQuery()
  const [personId, setPersonId] = useState('')
  const [leftReportId, setLeftReportId] = useState('')
  const [rightReportId, setRightReportId] = useState('')
  const { data: reportsData, isLoading: reportsLoading } = useHealthReportsQuery({
    personId,
    pageSize: 50,
  })
  const reports = reportsData?.items ?? []
  const comparison = useCompareHealthReportsQuery(leftReportId, rightReportId)

  useEffect(() => {
    if (!personId && persons.length > 0) setPersonId(persons[0].id)
  }, [personId, persons])

  useEffect(() => {
    setLeftReportId('')
    setRightReportId('')
  }, [personId])

  return (
    <AppHeaderMain fixed>
      <div className='mb-4'>
        <Button asChild variant='ghost' size='sm' className='mb-2 -ml-2'>
          <Link to='/health/reports'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回报告列表
          </Link>
        </Button>
        <h2 className='text-2xl font-bold tracking-tight'>跨期比较</h2>
        <p className='text-muted-foreground'>比较同一人员不同期次的相同指标</p>
      </div>

      <Card className='mb-4'>
        <CardHeader>
          <CardTitle className='flex items-center text-base'>
            <GitCompareArrows className='mr-2 h-4 w-4' />
            选择报告
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-3'>
          <SelectField label='人员' value={personId} onChange={setPersonId}>
            <option value=''>选择人员</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </SelectField>
          <SelectField label='较早报告' value={leftReportId} onChange={setLeftReportId}>
            <option value=''>选择报告</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title} · {formatDate(report.examDate)}
              </option>
            ))}
          </SelectField>
          <SelectField label='较晚报告' value={rightReportId} onChange={setRightReportId}>
            <option value=''>选择报告</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title} · {formatDate(report.examDate)}
              </option>
            ))}
          </SelectField>
          {reportsLoading && <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />}
        </CardContent>
      </Card>

      {comparison.error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle />
          <AlertTitle>比较失败</AlertTitle>
          <AlertDescription>{comparison.error.message}</AlertDescription>
        </Alert>
      )}

      {comparison.data && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              {comparison.data.person?.name ?? '未分配人员'}：{comparison.data.leftReport.title} 对比{' '}
              {comparison.data.rightReport.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>指标</TableHead>
                  <TableHead>单位</TableHead>
                  <TableHead>{comparison.data.leftReport.title}</TableHead>
                  <TableHead>{comparison.data.rightReport.title}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.data.metrics.map((metric) => (
                  <TableRow key={metric.code}>
                    <TableCell className='font-medium'>{metric.name}</TableCell>
                    <TableCell>{metric.unit ?? '-'}</TableCell>
                    <MetricCell metric={metric.left} />
                    <MetricCell metric={metric.right} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppHeaderMain>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}): ReactElement {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
      >
        {children}
      </select>
    </div>
  )
}

function MetricCell({ metric }: { metric: { valueText: string; flag: string } | null }): ReactElement {
  if (!metric) return <TableCell>-</TableCell>
  return (
    <TableCell>
      <span className='mr-2'>{metric.valueText}</span>
      <Badge variant={metric.flag === 'NORMAL' ? 'outline' : 'destructive'}>{formatFlag(metric.flag)}</Badge>
    </TableCell>
  )
}

function formatDate(value: Date | string | null): string {
  return value ? new Date(value).toLocaleDateString('zh-CN') : '未填写日期'
}

function formatFlag(flag: string): string {
  const labels: Record<string, string> = {
    LOW: '偏低',
    NORMAL: '正常',
    HIGH: '偏高',
    ABNORMAL: '异常',
    UNKNOWN: '未识别',
  }
  return labels[flag] ?? flag
}
