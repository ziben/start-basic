import { useState, useSyncExternalStore } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  ShieldCheck,
  Server,
  Layers,
  Settings,
  CreditCard,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export const Route = createFileRoute('/_authenticated/admin/dashboard')({
  component: AdminDashboard,
})

const trafficData = [
  { time: '00:00', requests: 1240, latency: 38 },
  { time: '03:00', requests: 820, latency: 35 },
  { time: '06:00', requests: 1100, latency: 40 },
  { time: '09:00', requests: 3840, latency: 48 },
  { time: '12:00', requests: 4620, latency: 52 },
  { time: '15:00', requests: 4180, latency: 45 },
  { time: '18:00', requests: 5210, latency: 49 },
  { time: '21:00', requests: 3650, latency: 42 },
  { time: '24:00', requests: 2190, latency: 39 },
]

const recentLogs = [
  {
    id: 1,
    action: '更新系统运行时配置 [CACHE_TTL]',
    user: 'admin@system.local',
    time: '2分钟前',
    type: 'info' as const,
  },
  {
    id: 2,
    action: '分配超级管理员权限至用户 ID #1042',
    user: 'superadmin',
    time: '18分钟前',
    type: 'success' as const,
  },
  {
    id: 3,
    action: '检测到频繁密码尝试 (IP 192.168.1.108)',
    user: 'auth-guard',
    time: '34分钟前',
    type: 'warning' as const,
  },
  {
    id: 4,
    action: '微信支付网关自动对账完成',
    user: 'cron-worker',
    time: '1小时前',
    type: 'success' as const,
  },
]

function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
        <Skeleton className='h-9 w-28' />
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-32 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Skeleton className='h-80 rounded-xl lg:col-span-2' />
        <Skeleton className='h-80 rounded-xl' />
      </div>
    </div>
  )
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function AdminDashboard() {
  const isMounted = useIsMounted()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  if (!isMounted) {
    return <DashboardSkeleton />
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>系统控制台</h1>
            <Badge variant='success' className='gap-1.5 py-0.5'>
              <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
              服务运行正常
            </Badge>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            实时监控系统吞吐、安全事件流与各服务模块运行健康指标
          </p>
        </div>
        <div className='flex items-center gap-2.5'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            className='h-8 gap-1.5 text-xs'
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新指标
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              活跃用户总数
            </CardTitle>
            <Users className='size-4 text-muted-foreground/70' />
          </CardHeader>
          <CardContent className='space-y-1.5'>
            <div className='font-mono text-2xl font-semibold tracking-tight'>1,284</div>
            <div className='flex items-center gap-2'>
              <Badge variant='success' className='gap-1 py-0 px-1.5 text-[10px]'>
                <ArrowUpRight className='size-3' />
                +12.4%
              </Badge>
              <span className='text-xs text-muted-foreground'>较上月新增 142 人</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              今日请求总量
            </CardTitle>
            <Zap className='size-4 text-muted-foreground/70' />
          </CardHeader>
          <CardContent className='space-y-1.5'>
            <div className='font-mono text-2xl font-semibold tracking-tight'>482.6 k</div>
            <div className='flex items-center gap-2'>
              <Badge variant='success' className='gap-1 py-0 px-1.5 text-[10px]'>
                <ArrowUpRight className='size-3' />
                +8.1%
              </Badge>
              <span className='text-xs text-muted-foreground'>平均 QPS 168</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              平均处理延迟
            </CardTitle>
            <Activity className='size-4 text-muted-foreground/70' />
          </CardHeader>
          <CardContent className='space-y-1.5'>
            <div className='font-mono text-2xl font-semibold tracking-tight'>42 ms</div>
            <div className='flex items-center gap-2'>
              <Badge variant='info' className='gap-1 py-0 px-1.5 text-[10px]'>
                <ArrowDownRight className='size-3' />
                -18.2%
              </Badge>
              <span className='text-xs text-muted-foreground'>P99 延迟 118ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              服务可用率
            </CardTitle>
            <Server className='size-4 text-muted-foreground/70' />
          </CardHeader>
          <CardContent className='space-y-1.5'>
            <div className='font-mono text-2xl font-semibold tracking-tight'>99.98%</div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='py-0 px-1.5 text-[10px]'>
                SLA 达标
              </Badge>
              <span className='text-xs text-muted-foreground'>连续运行 48 天</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Feeds */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Traffic Chart */}
        <Card className='lg:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <div>
              <CardTitle className='text-base font-semibold'>API 吞吐与流量趋势</CardTitle>
              <CardDescription className='mt-0.5 text-xs'>
                近 24 小时各时段系统接口调用频次分布 (QPS)
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <span className='size-2 rounded-full bg-primary' />
                请求量
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='h-[260px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id='trafficGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--foreground)' stopOpacity={0.25} />
                      <stop offset='95%' stopColor='var(--foreground)' stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--border)' opacity={0.6} />
                  <XAxis
                    dataKey='time'
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0].payload
                      return (
                        <div className='rounded-lg border border-border/80 bg-background/95 p-2.5 text-xs shadow-lg backdrop-blur-md dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'>
                          <div className='font-medium text-foreground'>{item.time}</div>
                          <div className='mt-1 flex items-center gap-3 text-muted-foreground'>
                            <span>请求数:</span>
                            <span className='font-mono font-semibold text-foreground'>{item.requests} req/s</span>
                          </div>
                          <div className='flex items-center gap-3 text-muted-foreground'>
                            <span>延迟:</span>
                            <span className='font-mono font-semibold text-foreground'>{item.latency} ms</span>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='requests'
                    stroke='var(--foreground)'
                    strokeWidth={1.5}
                    fill='url(#trafficGradient)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Stream */}
        <Card className='flex flex-col'>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base font-semibold'>安全与操作动态</CardTitle>
              <Link
                to='/admin/log'
                className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
              >
                查看全部 <ExternalLink className='size-3' />
              </Link>
            </div>
            <CardDescription className='mt-0.5 text-xs'>系统内关键权限变更与管理员操作流水</CardDescription>
          </CardHeader>
          <CardContent className='flex-1 space-y-3 pt-0'>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className='flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40 dark:border-white/5 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/60'
              >
                <div className='mt-0.5 shrink-0'>
                  {log.type === 'success' && (
                    <span className='flex size-2 rounded-full bg-emerald-500' />
                  )}
                  {log.type === 'warning' && (
                    <span className='flex size-2 rounded-full bg-amber-500' />
                  )}
                  {log.type === 'info' && (
                    <span className='flex size-2 rounded-full bg-sky-500' />
                  )}
                </div>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <div className='truncate text-xs font-medium text-foreground'>{log.action}</div>
                  <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                    <span>{log.user}</span>
                    <span>·</span>
                    <span>{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fast Navigation Grid */}
      <div>
        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          核心管理入口
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Link
            to='/admin/users'
            className='group flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 hover:border-foreground/30 hover:shadow-sm dark:border-white/[0.08] dark:hover:border-white/20'
          >
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:border-white/10 dark:bg-zinc-900'>
              <Users className='size-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium text-foreground group-hover:text-primary'>用户与账号</div>
              <div className='truncate text-xs text-muted-foreground'>用户列表、状态与身份认证</div>
            </div>
          </Link>

          <Link
            to='/admin/rbac/roles'
            className='group flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 hover:border-foreground/30 hover:shadow-sm dark:border-white/[0.08] dark:hover:border-white/20'
          >
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:border-white/10 dark:bg-zinc-900'>
              <KeyRound className='size-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium text-foreground group-hover:text-primary'>权限与角色</div>
              <div className='truncate text-xs text-muted-foreground'>RBAC 访问控制策略配置</div>
            </div>
          </Link>

          <Link
            to='/admin/system-config'
            className='group flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 hover:border-foreground/30 hover:shadow-sm dark:border-white/[0.08] dark:hover:border-white/20'
          >
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:border-white/10 dark:bg-zinc-900'>
              <Settings className='size-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium text-foreground group-hover:text-primary'>系统配置</div>
              <div className='truncate text-xs text-muted-foreground'>运行时参数与环境变量管控</div>
            </div>
          </Link>

          <Link
            to='/admin/payment/orders'
            className='group flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-150 hover:border-foreground/30 hover:shadow-sm dark:border-white/[0.08] dark:hover:border-white/20'
          >
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:border-white/10 dark:bg-zinc-900'>
              <CreditCard className='size-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium text-foreground group-hover:text-primary'>支付与订单</div>
              <div className='truncate text-xs text-muted-foreground'>交易流向、微信商户与订单明细</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
