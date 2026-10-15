import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { QueryState } from '@/shared/components/query-state'
import { BadgeCheck, CircleAlert, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { authClient } from '~/modules/auth/shared/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getAdminAccountFn, setAdminPasswordFn, unlinkAdminAccountFn } from './server-fns/account.fn'
import { type AdminAccountOverview } from './services/account.service'

export default function AdminAccount(): React.ReactElement {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newPassword, setNewPassword] = useState('')
  const [pendingAction, setPendingAction] = useState<{
    type: 'password' | 'unlink'
    userId: string
    userLabel: string
    accountId?: string
  } | null>(null)
  const search = useSearch({ from: '/_authenticated/admin/account' })
  const targetUserId = search.userId
  const sessionQuery = useQuery({
    queryKey: ['admin', 'account', 'session'],
    queryFn: async () => {
      const result = await authClient.getSession()
      return result?.data ?? null
    },
  })

  const overviewQuery = useQuery<AdminAccountOverview>({
    queryKey: ['admin', 'account', 'overview', targetUserId ?? 'self'],
    queryFn: async () => {
      return await getAdminAccountFn({ data: { userId: targetUserId } })
    },
  })

  const resetPassword = useMutation({
    mutationFn: async (payload: { newPassword: string }) =>
      setAdminPasswordFn({ data: { ...payload, userId: targetUserId } }),
    onSuccess: () => {
      setNewPassword('')
      setPendingAction(null)
      toast.success('密码已重置')
    },
    onError: (error) => {
      toast.error('重置失败', { description: String(error) })
    },
  })

  const unlinkAccount = useMutation({
    mutationFn: async ({ accountId }: { accountId: string }) =>
      unlinkAdminAccountFn({ data: { accountId, userId: targetUserId } }),
    onSuccess: async () => {
      setPendingAction(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'account', 'overview'] })
      toast.success('已解绑账号')
    },
    onError: (error) => {
      toast.error('解绑失败', { description: String(error) })
    },
  })

  const session = sessionQuery.data
  const overview = overviewQuery.data
  const accounts: AdminAccountOverview['accounts'] = overview?.accounts ?? []
  const hasAccounts = accounts.length > 0
  const userId = overview?.user?.id
  const isBusy = resetPassword.isPending || unlinkAccount.isPending
  const canManageAccount = !!userId && !overviewQuery.isFetching && !overviewQuery.error

  return (
    <AppHeaderMain>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{t('admin.account.title')}</h2>
          <p className='text-muted-foreground'>{t('admin.account.desc')}</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          disabled={!userId}
          onClick={() => {
            if (!userId) return
            const params = new URLSearchParams({ filter: userId })
            globalThis.location.href = `/admin/session?${params.toString()}`
          }}
        >
          进入会话管理
        </Button>
      </div>

      {overviewQuery.isLoading ? <div className='py-8 text-center text-muted-foreground'>加载中...</div> : null}
      {overviewQuery.error ? (
        <QueryState
          error={overviewQuery.error}
          onRetry={() => void overviewQuery.refetch()}
          isRetrying={overviewQuery.isRefetching}
        />
      ) : null}

      {!overviewQuery.isLoading && !overviewQuery.error ? (
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Session</CardTitle>
              <BadgeCheck className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{session?.user?.email ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>当前登录管理员</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>User</CardTitle>
              <CircleAlert className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{overview?.user?.name ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>{overview?.user?.role ?? 'no role'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Linked Accounts</CardTitle>
              <Link2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{accounts.length}</div>
              <p className='text-xs text-muted-foreground'>OAuth/Password 绑定数</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className='mt-6 grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Session Detail</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Session ID</span>
              <span>{overview?.session.id ?? '—'}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Expires At</span>
              <span>{overview?.session.expiresAt ? new Date(overview.session.expiresAt).toLocaleString() : '—'}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>User ID</span>
              <span>{overview?.session.user.id ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>绑定账号</CardTitle>
          </CardHeader>
          <CardContent>
            {hasAccounts ? (
              <div className='space-y-3 text-sm'>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className='flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2'
                  >
                    <div className='min-w-0 break-all'>
                      <div className='font-medium'>{account.providerId}</div>
                      <div className='text-xs text-muted-foreground'>{account.accountId}</div>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>{new Date(account.createdAt).toLocaleDateString()}</span>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={isBusy || !canManageAccount}
                        onClick={() => {
                          if (!userId) return
                          setPendingAction({
                            type: 'unlink',
                            userId,
                            userLabel: overview?.user?.name || userId,
                            accountId: account.id,
                          })
                        }}
                      >
                        解绑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-sm text-muted-foreground'>暂无绑定账号</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>重置密码</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Label htmlFor='admin-new-password'>新密码</Label>
            <Input
              id='admin-new-password'
              placeholder='新密码'
              type='password'
              autoComplete='new-password'
              disabled={isBusy || !!pendingAction || !canManageAccount}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button
              size='sm'
              disabled={isBusy || !canManageAccount || !newPassword.trim()}
              onClick={() => {
                if (!userId) return
                setPendingAction({ type: 'password', userId, userLabel: overview?.user?.name || userId })
              }}
            >
              重置密码
            </Button>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(next) => {
          if (!next && !isBusy) setPendingAction(null)
        }}
        title={pendingAction?.type === 'unlink' ? '确认解绑账号？' : '确认重置密码？'}
        desc={`即将${pendingAction?.type === 'unlink' ? '解绑账号' : '重置密码'}，目标用户：${pendingAction?.userLabel ?? ''}。请确认操作对象。`}
        confirmText='确认'
        cancelBtnText='取消'
        destructive
        isLoading={isBusy}
        disabled={!canManageAccount || pendingAction?.userId !== userId}
        handleConfirm={() => {
          if (!pendingAction || isBusy || !canManageAccount || pendingAction.userId !== userId) return
          if (pendingAction.type === 'unlink' && pendingAction.accountId) {
            unlinkAccount.mutate({ accountId: pendingAction.accountId })
          } else if (pendingAction.type === 'password' && newPassword.trim()) {
            resetPassword.mutate({ newPassword })
          }
        }}
      />
    </AppHeaderMain>
  )
}
