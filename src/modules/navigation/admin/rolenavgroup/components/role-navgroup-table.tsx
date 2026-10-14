import { QueryState } from '@/shared/components/query-state'
import { Loader2, Settings2 } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useAllRoles } from '~/modules/rbac/system-roles/hooks/use-role-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RoleNavGroupTableProps {
  onManage: (roleId: string) => void
}

export function RoleNavGroupTable({ onManage }: RoleNavGroupTableProps) {
  const { t } = useTranslation()
  const { data: roles, isLoading, error, refetch, isRefetching } = useAllRoles()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.rolenavgroup.table.title')}</CardTitle>
        <CardDescription>{t('admin.rolenavgroup.table.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} isRetrying={isRefetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.rolenavgroup.table.columns.name')}</TableHead>
                <TableHead>{t('admin.rolenavgroup.table.columns.key')}</TableHead>
                <TableHead>{t('admin.rolenavgroup.table.columns.system')}</TableHead>
                <TableHead className='text-right'>{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!roles?.length && (
                <TableRow>
                  <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                    {t('admin.common.noData')}
                  </TableCell>
                </TableRow>
              )}
              {roles?.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>
                    {t(role.displayName ?? role.name, {
                      defaultMessage: role.displayName ?? role.name,
                    })}
                  </TableCell>
                  <TableCell>
                    {t(role.name, {
                      defaultMessage: role.name,
                    })}
                  </TableCell>
                  <TableCell>{role.isSystem ? t('common.yes') : t('common.no')}</TableCell>
                  <TableCell className='text-right'>
                    <Button variant='outline' size='sm' onClick={() => onManage(role.id)}>
                      <Settings2 className='mr-2 h-4 w-4' />
                      {t('admin.rolenavgroup.table.manage')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </CardContent>
    </Card>
  )
}
