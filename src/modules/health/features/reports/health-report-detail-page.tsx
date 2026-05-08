import { Link } from '@tanstack/react-router'
import { Activity, AlertCircle, ArrowLeft } from 'lucide-react'
import type { ReactElement } from 'react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useHealthReportQuery } from '../../shared/hooks/use-health-reports'

interface HealthReportDetailPageProps {
  readonly reportId: string
}

export function HealthReportDetailPage({ reportId }: HealthReportDetailPageProps): ReactElement {
  const { data: report, error, isLoading } = useHealthReportQuery(reportId)

  return (
    <AppHeaderMain fixed>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/health/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回报告列表
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{report?.title ?? '体检报告详情'}</h2>
          <p className="text-muted-foreground">{formatDate(report?.examDate ?? null)}</p>
        </div>
        {report && <Badge variant="secondary">{report.metrics.length} 项指标</Badge>}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertTitle>报告详情加载失败</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : '请稍后重试'}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Activity className="mr-2 h-4 w-4" />
            指标明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指标</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>参考范围</TableHead>
                <TableHead>标记</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-28 text-center">
                    正在加载指标明细...
                  </TableCell>
                </TableRow>
              )}
              {report?.metrics.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="font-medium">{metric.rawName}</TableCell>
                  <TableCell>{metric.valueText}</TableCell>
                  <TableCell>{metric.unit ?? '-'}</TableCell>
                  <TableCell>{metric.referenceRange ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getFlagBadgeVariant(metric.flag)}>{formatFlag(metric.flag)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !report && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-28 text-center">
                    未找到体检报告
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

function getFlagBadgeVariant(flag: string): 'outline' | 'secondary' | 'destructive' {
  if (flag === 'NORMAL') return 'outline'
  if (flag === 'UNKNOWN') return 'secondary'
  return 'destructive'
}

function formatDate(value: Date | string | null): string {
  if (!value) return '未填写体检日期'
  return new Date(value).toLocaleDateString('zh-CN')
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
