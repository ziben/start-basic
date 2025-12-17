import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, User, Clock, Globe, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '~/lib/api-client'

const Sessions: React.FC = () => {
  const {
    data: sessions,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => await apiClient.sessions.list(),
    refetchInterval: 30000, // 30秒自动刷新
  })

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  }

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return '📱 iOS'
    if (userAgent.includes('Android')) return '📱 Android'
    if (userAgent.includes('Macintosh')) return '💻 macOS'
    if (userAgent.includes('Windows')) return '💻 Windows'
    if (userAgent.includes('Linux')) return '💻 Linux'
    return '🖥️ 其他'
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            会话管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">加载会话信息失败</p>
            <Button onClick={() => refetch()} variant="outline">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">会话管理</h1>
          <p className="text-muted-foreground">查看和管理系统用户会话</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            活跃会话
            {sessions && (
              <Badge variant="secondary" className="ml-2">
                {sessions.length} 个会话
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sessions?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无活跃会话</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>登录时间</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>设备</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions?.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.isActive ? 'default' : 'secondary'}>
                          {session.isActive ? '活跃' : '已过期'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.loginTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3" />
                          {session.ipAddress}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatUserAgent(session.userAgent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Sessions
