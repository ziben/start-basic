import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPermissionFn, updatePermissionFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { usePermissionsContext } from '../context/permissions-context'
import { useResourcesQuery } from '../hooks/use-permissions-queries'

const formSchema = z.object({
  resourceId: z.string().min(1, '请选择资源'),
  actionId: z.string().min(1, '请选择操作'),
  displayName: z.string().min(1, '显示名称不能为空'),
  category: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function PermissionMutateDialog() {
  const { permissionDialog, closePermissionDialog } = usePermissionsContext()
  const queryClient = useQueryClient()
  const { data: resources = [] } = useResourcesQuery()

  const permission = permissionDialog.data
  const isEdit = !!permission?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceId: '',
      actionId: '',
      displayName: '',
      category: '',
      description: '',
    },
  })

  // 监听资源变化以过滤可选操作
  const selectedResourceId = form.watch('resourceId')
  const selectedResource = resources.find((r: any) => r.id === selectedResourceId)
  const availableActions = selectedResource?.actions || []

  useEffect(() => {
    if (permissionDialog.isOpen) {
      if (isEdit && permission) {
        form.reset({
          resourceId: permission.resourceId,
          actionId: permission.actionId,
          displayName: permission.displayName,
          category: permission.category || '',
          description: permission.description || '',
        })
      } else {
        form.reset({
          resourceId: '',
          actionId: '',
          displayName: '',
          category: '',
          description: '',
        })
      }
    }
  }, [permissionDialog.isOpen, isEdit, permission, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createPermissionFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'permissions'] })
      toast.success('权限点创建成功')
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error('创建失败', { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!permission?.id) throw new Error('权限ID不存在')
      return updatePermissionFn({
        data: {
          id: permission.id,
          displayName: data.displayName,
          category: data.category,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'permissions'] })
      toast.success('权限点更新成功')
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error('更新失败', { description: error.message })
    },
  })

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={permissionDialog.isOpen} onOpenChange={closePermissionDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑权限点' : '新增权限点'}</DialogTitle>
          <DialogDescription>
            创建资源与操作的组合作为权限代码
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属资源</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择资源" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resources.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.displayName} ({r.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>对应操作</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit || !selectedResourceId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedResourceId ? "请选择操作" : "请先选择资源"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableActions.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.displayName} ({a.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>权限名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如: 创建用户, 查看组织" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如: 用户管理, 系统设置" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePermissionDialog}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
