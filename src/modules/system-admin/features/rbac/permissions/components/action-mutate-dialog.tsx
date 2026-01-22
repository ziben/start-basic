import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActionFn, updateActionFn, deleteActionFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { toast } from 'sonner'
import { rbacResourcesQueryKeys } from '~/shared/lib/query-keys'
import { usePermissionsContext } from '../context/permissions-context'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

const formSchema = z.object({
  name: z.string().min(1, '操作名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ActionMutateDialog() {
  const { actionDialog, closeActionDialog } = usePermissionsContext()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const resourceId = actionDialog.data?.resourceId
  const action = actionDialog.data?.action
  const isEdit = !!action?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
    },
  })

  useEffect(() => {
    if (actionDialog.isOpen) {
      if (isEdit && action) {
        form.reset({
          name: action.name,
          displayName: action.displayName,
          description: action.description || '',
        })
      } else {
        form.reset({
          name: '',
          displayName: '',
          description: '',
        })
      }
    }
  }, [actionDialog.isOpen, isEdit, action, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!resourceId) throw new Error('资源ID不存在')
      return createActionFn({ 
        data: { 
          ...data,
          resourceId 
        } 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success('操作创建成功')
      closeActionDialog()
    },
    onError: (error: Error) => {
      toast.error('创建失败', { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!action?.id) throw new Error('操作ID不存在')
      return updateActionFn({
        data: {
          id: action.id,
          displayName: data.displayName,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success('操作更新成功')
      closeActionDialog()
    },
    onError: (error: Error) => {
      toast.error('更新失败', { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!action?.id) throw new Error('操作ID不存在')
      return deleteActionFn({ data: { id: action.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success('操作删除成功')
      setIsConfirmOpen(false)
      closeActionDialog()
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
      <Dialog open={actionDialog.isOpen} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>{isEdit ? '编辑操作' : '新增操作'}</DialogTitle>
              {isEdit && !action?.isSystem && (
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
              定义该资源支持的操作行为
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>操作标识</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如: create, read, export" disabled={isEdit} />
                    </FormControl>
                    <FormDescription>英文标识符，如 'create'</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>显示名称</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如: 创建, 导出" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="可选描述信息" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeActionDialog}>
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

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="删除操作"
        desc={
          <>
            确定要删除操作 <strong>{action?.displayName}</strong> 吗？
            <br />
            这将导致关联的所有权限点失效，且不可撤销。
          </>
        }
        destructive
        handleConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
