import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createResourceFn, updateResourceFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { usePermissionsContext } from '../context/permissions-context'

const formSchema = z.object({
  name: z.string().min(1, '资源名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'ORGANIZATION', 'BOTH']),
})

type FormValues = z.infer<typeof formSchema>

export function ResourceMutateDialog() {
  const { resourceDialog, closeResourceDialog } = usePermissionsContext()
  const queryClient = useQueryClient()

  const isEdit = !!resourceDialog.data?.id
  const resource = resourceDialog.data

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      scope: 'BOTH',
    },
  })

  useEffect(() => {
    if (resourceDialog.isOpen) {
      if (isEdit && resource) {
        form.reset({
          name: resource.name,
          displayName: resource.displayName,
          description: resource.description || '',
          scope: resource.scope as 'GLOBAL' | 'ORGANIZATION' | 'BOTH',
        })
      } else {
        form.reset({
          name: '',
          displayName: '',
          description: '',
          scope: 'BOTH',
        })
      }
    }
  }, [resourceDialog.isOpen, isEdit, resource, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createResourceFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'resources'] })
      toast.success('资源创建成功')
      closeResourceDialog()
    },
    onError: (error: Error) => {
      toast.error('创建失败', { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!resource?.id) throw new Error('资源ID不存在')
      return updateResourceFn({
        data: {
          id: resource.id,
          displayName: data.displayName,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'resources'] })
      toast.success('资源更新成功')
      closeResourceDialog()
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
    <Dialog open={resourceDialog.isOpen} onOpenChange={closeResourceDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑资源' : '新增资源'}</DialogTitle>
          <DialogDescription>
            定义系统中的业务实体资源
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>资源标识</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如: user, order" disabled={isEdit} />
                  </FormControl>
                  <FormDescription>英文标识符，创建后不可修改</FormDescription>
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
                    <Input {...field} placeholder="例如: 用户管理, 订单中心" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作用域</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择作用域" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GLOBAL">仅全局</SelectItem>
                      <SelectItem value="ORGANIZATION">仅组织</SelectItem>
                      <SelectItem value="BOTH">两者皆可</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea {...field} placeholder="资源用途描述" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeResourceDialog}>
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
