import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createRoleSchema, type CreateRoleData } from '../data/schema'
import { useCreateRole, useUpdateRole } from '~/modules/system-admin/shared/hooks/use-role-api'
import { useRolesContext } from '../context/roles-context'
import { useEffect } from 'react'

export function AdminRolesMutateDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useRolesContext()
  const isUpdate = open === 'update'
  
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  const form = useForm<CreateRoleData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      label: '',
      description: '',
    },
  })

  useEffect(() => {
    if (isUpdate && currentRow) {
      form.reset({
        name: currentRow.name,
        label: currentRow.label,
        description: currentRow.description || '',
      })
    } else {
      form.reset({
        name: '',
        label: '',
        description: '',
      })
    }
  }, [isUpdate, currentRow, form])

  const onSubmit = async (data: CreateRoleData) => {
    try {
      if (isUpdate && currentRow) {
        await updateRole.mutateAsync({ id: currentRow.id, data })
        toast.success('角色更新成功')
      } else {
        await createRole.mutateAsync(data)
        toast.success('角色创建成功')
      }
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast.error(isUpdate ? '更新失败' : '创建失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return (
    <Dialog
      open={open === 'create' || open === 'update'}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(null)
          setCurrentRow(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isUpdate ? '编辑角色' : '创建新角色'}</DialogTitle>
          <DialogDescription>
            {isUpdate ? '修改角色信息' : '添加一个新的系统角色'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色编码</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='例如: admin' disabled={isUpdate && currentRow?.isSystem} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>显示名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='例如: 管理员' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='角色功能描述...' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='gap-2 pt-2 sm:gap-0'>
              <Button type='button' variant='outline' onClick={() => setOpen(null)}>
                取消
              </Button>
              <Button type='submit' disabled={createRole.isPending || updateRole.isPending}>
                {(createRole.isPending || updateRole.isPending) && (
                  <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
