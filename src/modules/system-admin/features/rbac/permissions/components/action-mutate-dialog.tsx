import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActionFn, updateActionFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { usePermissionsContext } from '../context/permissions-context'

const formSchema = z.object({
  name: z.string().min(1, '操作名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ActionMutateDialog() {
  const { actionDialog, closeActionDialog } = usePermissionsContext()
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({ queryKey: ['rbac', 'resources'] })
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
      queryClient.invalidateQueries({ queryKey: ['rbac', 'resources'] })
      toast.success('操作更新成功')
      closeActionDialog()
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
    <Dialog open={actionDialog.isOpen} onOpenChange={closeActionDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑操作' : '新增操作'}</DialogTitle>
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
  )
}
