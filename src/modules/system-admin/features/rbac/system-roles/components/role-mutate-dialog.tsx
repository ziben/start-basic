import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRoleFn, updateRoleFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { roleQueryKeys } from '~/shared/lib/query-keys'
import { useRolesContext } from '../context/roles-context'

const formSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'ORGANIZATION', 'CUSTOM']),
  category: z.string().optional(),
  isTemplate: z.boolean(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export function RoleMutateDialog() {
  const { editDialog, closeEditDialog, createDialog, closeCreateDialog } = useRolesContext()
  const queryClient = useQueryClient()

  const isEdit = editDialog.isOpen
  const isCreate = createDialog.isOpen
  const role = editDialog.role

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      scope: 'CUSTOM',
      category: '',
      isTemplate: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (isEdit && role) {
      form.reset({
        name: role.name,
        displayName: role.displayName,
        description: role.description || '',
        scope: role.scope as 'GLOBAL' | 'ORGANIZATION' | 'CUSTOM',
        category: role.category || '',
        isTemplate: role.isTemplate,
        isActive: role.isActive,
      })
    } else if (isCreate) {
      form.reset({
        name: '',
        displayName: '',
        description: '',
        scope: 'CUSTOM',
        category: '',
        isTemplate: false,
        isActive: true,
      })
    }
  }, [isEdit, isCreate, role, form])

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await createRoleFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success('创建成功')
      closeCreateDialog()
      form.reset()
    },
    onError: (error: Error) => {
      toast.error('创建失败', { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!role) throw new Error('角色不存在')
      return await updateRoleFn({
        data: {
          id: role.id,
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success('更新成功')
      closeEditDialog()
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

  const handleClose = () => {
    if (isEdit) {
      closeEditDialog()
    } else {
      closeCreateDialog()
    }
    form.reset()
  }

  return (
    <Dialog open={isEdit || isCreate} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息' : '创建新的角色'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：content-manager" disabled={isEdit} />
                  </FormControl>
                  <FormDescription>唯一标识符，创建后不可修改</FormDescription>
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
                    <Input {...field} placeholder="例如：内容管理员" />
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
                    <Textarea {...field} placeholder="角色描述" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作用域</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择作用域" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GLOBAL">全局</SelectItem>
                        <SelectItem value="ORGANIZATION">组织</SelectItem>
                        <SelectItem value="CUSTOM">自定义</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input {...field} placeholder="例如：内容管理" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>角色模板</FormLabel>
                      <FormDescription>可被组织实例化</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>启用状态</FormLabel>
                      <FormDescription>是否启用此角色</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
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
