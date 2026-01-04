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
import { useAllRoles } from '@/modules/system-admin/shared/hooks/use-role-api'

interface RoleNavGroupTableProps {
    onManage: (roleId: string) => void
}

export function RoleNavGroupTable({ onManage }: RoleNavGroupTableProps) {
    const { data: roles, isLoading } = useAllRoles()

    return (
        <Card>
            <CardHeader>
                <CardTitle>角色菜单配置</CardTitle>
                <CardDescription>为每个角色分配可访问的菜单组权限</CardDescription>
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
                                            onClick={() => onManage(role.id)}
                                        >
                                            <Settings2 className='mr-2 h-4 w-4' />
                                            配置菜单
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
