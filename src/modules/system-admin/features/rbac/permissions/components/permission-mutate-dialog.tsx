import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPermissionFn, updatePermissionFn, deletePermissionFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { rbacPermissionsQueryKeys } from '~/shared/lib/query-keys'
import { usePermissionsContext } from '../context/permissions-context'
import { useResourcesQuery } from '../hooks/use-permissions-queries'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const isEdit = !!permissionDialog.data?.id
  const permission = permissionDialog.data

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      description: '',
      resourceId: '',
      actionId: '',
      category: '',
    },
  })

  // 监听资源变化，重置操作
  const selectedResourceId = useWatch({
    control: form.control,
    name: 'resourceId',
  })
  const availableActions = resources.find((r: any) => r.id === selectedResourceId)?.actions || []

  useEffect(() => {
    if (permissionDialog.isOpen) {
      if (isEdit && permission) {
        form.reset({
          displayName: permission.displayName,
          description: permission.description || '',
          resourceId: permission.resourceId,
          actionId: permission.actionId,
          category: permission.category || '',
        })
      } else {
        form.reset({
          displayName: '',
          description: '',
          resourceId: '',
          actionId: '',
          category: '',
        })
      }
    }
  }, [permissionDialog.isOpen, isEdit, permission, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createPermissionFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
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
          description: data.description,
          category: data.category,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
      toast.success('权限点更新成功')
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error('更新失败', { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!permission?.id) throw new Error('权限ID不存在')
      return deletePermissionFn({ data: { id: permission.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
      toast.success('权限点删除成功')
      setIsConfirmOpen(false)
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error('删除失败', { description: error.message })
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
    <>
      <Dialog open={permissionDialog.isOpen} onOpenChange={closePermissionDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>{isEdit ? '编辑权限点' : '新增权限点'}</DialogTitle>
              {isEdit && !permission?.isSystem && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:bg-destructive/10'
                  onClick={() => setIsConfirmOpen(true)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              )}
            </div>
            <DialogDescription>
              权限点由“资源”和“操作”组合而成，用于前端和后端的权限校验。
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-2'>
              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>显示名称</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='例如: 创建用户, 导出订单' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='resourceId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属资源</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue('actionId', '') // 切换资源时清空已选操作
                        }}
                        value={field.value}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='选择资源' />
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
                  name='actionId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>执行操作</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEdit || !selectedResourceId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='选择操作' />
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
              </div>

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类 (可选)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='例如: 系统管理, 业务功能' />
                    </FormControl>
                    <FormDescription>用于权限点分组展示</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述 (可选)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='权限用途描述' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className='pt-4'>
                <Button type='button' variant='outline' onClick={closePermissionDialog}>
                  取消
                </Button>
                <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
                  {isEdit ? '保存' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title='删除权限点'
        desc={
          <>
            确定要删除权限点 <strong>{permission?.displayName}</strong> 吗？
            <br />
            这将导致所有关联该权限的角色失去此权限，且不可撤销。
          </>
        }
        destructive
        handleConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
