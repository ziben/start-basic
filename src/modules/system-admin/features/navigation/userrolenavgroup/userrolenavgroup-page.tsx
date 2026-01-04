import { AppHeaderMain } from '~/components/layout/app-header-main'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminUserRoleNavGroup() {
  const { t } = useTranslation()

  return (
    <AppHeaderMain>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            {t('admin.userrolenavgroup.title', { defaultMessage: '用户角色菜单管理' })}
          </h2>
          <p className='text-muted-foreground'>
            {t('admin.userrolenavgroup.desc', { defaultMessage: '管理用户的角色菜单权限' })}
          </p>
        </div>
      </div>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
        <Card>
          <CardHeader>
            <CardTitle>用户角色菜单</CardTitle>
            <CardDescription>为用户分配特定的角色菜单权限</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex h-40 items-center justify-center text-muted-foreground'>
              功能开发中...
            </div>
          </CardContent>
        </Card>
      </div>
    </AppHeaderMain>
  )
}





