import { useState } from 'react'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { useAllRoles } from '@/modules/system-admin/shared/hooks/use-role-api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2, Loader2 } from 'lucide-react'
import { RoleNavGroupManageDialog } from './components/role-navgroup-manage-dialog'

export default function AdminRoleNavGroup() {
  const { t } = useTranslation()
  const { data: roles, isLoading } = useAllRoles()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleManage = (id: string) => {
    setSelectedRoleId(id)
    setIsDialogOpen(true)
  }

  return (
    <div className='flex flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.rolenavgroup.title')}</CardTitle>
          <CardDescription>{t('admin.rolenavgroup.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-40 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>角色标识</TableHead>
                  <TableHead>系统角色</TableHead>
                  <TableHead className='text-right'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role: any) => (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>{role.label}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.isSystem ? '是' : '否'}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleManage(role.id)}
                      >
                        <Settings2 className='mr-2 h-4 w-4' />
                        配置导航组
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RoleNavGroupManageDialog
        roleId={selectedRoleId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
