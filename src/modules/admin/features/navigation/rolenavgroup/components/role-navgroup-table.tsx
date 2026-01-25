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
import { Loader2, Settings2 } from 'lucide-react'
import { useAllRoles } from '@/modules/admin/shared/hooks/use-role-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'

interface RoleNavGroupTableProps {
    onManage: (roleId: string) => void
}

export function RoleNavGroupTable({ onManage }: RoleNavGroupTableProps) {
    const { t } = useTranslation()
    const { data: roles, isLoading } = useAllRoles()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.rolenavgroup.table.title')}</CardTitle>
                <CardDescription>{t('admin.rolenavgroup.table.desc')}</CardDescription>
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
                                <TableHead>{t('admin.rolenavgroup.table.columns.name')}</TableHead>
                                <TableHead>{t('admin.rolenavgroup.table.columns.key')}</TableHead>
                                <TableHead>{t('admin.rolenavgroup.table.columns.system')}</TableHead>
                                <TableHead className='text-right'>{t('admin.common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
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
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => onManage(role.id)}
                                        >
                                            <Settings2 className='mr-2 h-4 w-4' />
                                            {t('admin.rolenavgroup.table.manage')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
