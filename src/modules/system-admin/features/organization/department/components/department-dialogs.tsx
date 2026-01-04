/**
 * 部门 CRUD 对话框
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
    type Department,
} from '../../../../shared/hooks/use-department-api'
// ============ Schema ============
const departmentSchema = z.object({
    name: z.string().min(1, '部门名称不能为空'),
    code: z.string().min(1, '部门编码不能为空'),
    parentId: z.string().optional(),
    leader: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    sort: z.number().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})
type DepartmentFormData = z.infer<typeof departmentSchema>
// ============ 创建/编辑对话框 ============
interface DepartmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    department?: Department | null
    parentId?: string
    organizationId: string
    departments: Department[]
}
export function DepartmentDialog({
    open,
    onOpenChange,
    department,
    parentId,
    organizationId,
    departments,
}: DepartmentDialogProps) {
    const isEdit = !!department
    const createMutation = useCreateDepartment()
    const updateMutation = useUpdateDepartment()
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            status: 'ACTIVE',
            sort: 0,
        },
    })
    // 重置表单
    useEffect(() => {
        if (open) {
            if (department) {
                reset({
                    name: department.name,
                    code: department.code,
                    parentId: department.parentId || undefined,
                    leader: department.leader || undefined,
                    phone: department.phone || undefined,
                    email: department.email || undefined,
                    sort: department.sort,
                    status: department.status as 'ACTIVE' | 'INACTIVE',
                })
            } else {
                reset({
                    name: '',
                    code: '',
                    parentId: parentId || undefined,
                    leader: '',
                    phone: '',
                    email: '',
                    sort: 0,
                    status: 'ACTIVE',
                })
            }
        }
    }, [open, department, parentId, reset])
    const onSubmit = async (data: DepartmentFormData) => {
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({
                    id: department.id,
                    data,
                })
                toast.success('部门更新成功')
            } else {
                await createMutation.mutateAsync({
                    ...data,
                    organizationId,
                })
                toast.success('部门创建成功')
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '操作失败')
        }
    }
    // 过滤掉自己和子孙部门（编辑时）
    const availableParents = isEdit
        ? departments.filter(d => d.id !== department.id && !d.parentId?.startsWith(department.id))
        : departments
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '编辑部门' : '创建部门'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? '修改部门信息' : '填写以下信息创建新部门'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* 部门名称 */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            部门名称 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="请输入部门名称"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    {/* 部门编码 */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            部门编码 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="code"
                            {...register('code')}
                            placeholder="请输入部门编码"
                        />
                        {errors.code && (
                            <p className="text-sm text-destructive">{errors.code.message}</p>
                        )}
                    </div>
                    {/* 上级部门 */}
                    <div className="space-y-2">
                        <Label htmlFor="parentId">上级部门</Label>
                        <Select
                            value={watch('parentId') || 'none'}
                            onValueChange={(value) =>
                                setValue('parentId', value === 'none' ? undefined : value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择上级部门" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">无（顶级部门）</SelectItem>
                                {availableParents.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {'  '.repeat(dept.level - 1)}{dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* 负责人 */}
                    <div className="space-y-2">
                        <Label htmlFor="leader">负责人</Label>
                        <Input
                            id="leader"
                            {...register('leader')}
                            placeholder="请输入负责人姓名"
                        />
                    </div>
                    {/* 联系电话 */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">联系电话</Label>
                        <Input
                            id="phone"
                            {...register('phone')}
                            placeholder="请输入联系电话"
                        />
                    </div>
                    {/* 邮箱 */}
                    <div className="space-y-2">
                        <Label htmlFor="email">邮箱</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="请输入邮箱地址"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>
                    {/* 排序 */}
                    <div className="space-y-2">
                        <Label htmlFor="sort">排序</Label>
                        <Input
                            id="sort"
                            type="number"
                            {...register('sort', { valueAsNumber: true })}
                            placeholder="数字越小越靠前"
                        />
                    </div>
                    {/* 状态（仅编辑时显示） */}
                    {isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <Select
                                value={watch('status')}
                                onValueChange={(value) =>
                                    setValue('status', value as 'ACTIVE' | 'INACTIVE')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">启用</SelectItem>
                                    <SelectItem value="INACTIVE">停用</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? '保存中...'
                                : '确定'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
// ============ 删除确认对话框 ============
interface DeleteDepartmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    department: Department | null
    organizationId: string
}
export function DeleteDepartmentDialog({
    open,
    onOpenChange,
    department,
    organizationId,
}: DeleteDepartmentDialogProps) {
    const deleteMutation = useDeleteDepartment()
    const handleDelete = async () => {
        if (!department) return
        try {
            await deleteMutation.mutateAsync({
                id: department.id,
                organizationId,
            })
            toast.success('部门删除成功')
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '删除失败')
        }
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogDescription>
                        确定要删除部门 <span className="font-semibold text-foreground">"{department?.name}"</span> 吗？
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                    <p>⚠️ 此操作不可撤销</p>
                    <p className="mt-1">删除前请确保：</p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                        <li>该部门下没有子部门</li>
                        <li>该部门下没有成员</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? '删除中...' : '确认删除'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}