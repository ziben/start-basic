import { useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createMemberFn, updateMemberFn } from '~/modules/admin/features/organization/members/server-fns/member.fn'
import { getOrganizationsFn } from '~/modules/admin/features/organization/organizations/server-fns/organization.fn'
import { getUsersFn } from '~/modules/admin/features/identity/users/server-fns/user.fn'
import { DepartmentSelector } from '../../../../shared/components/department-selector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { memberQueryKeys, organizationQueryKeys, userQueryKeys } from '~/shared/lib/query-keys'
import { type Member } from '../data/schema'

type MemberMutateDialogProps = {
  currentRow?: Member
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberMutateDialog({ currentRow, open, onOpenChange }: MemberMutateDialogProps) {
  const isEdit = !!currentRow

  const { data: usersData } = useQuery({
    queryKey: userQueryKeys.list({ page: 1, pageSize: 50 }),
    queryFn: async () => {
      const result = await getUsersFn({ data: { page: 1, pageSize: 50 } })
      return result
    },
    enabled: !isEdit && open,
  })

  const { data: orgsData } = useQuery({
    queryKey: organizationQueryKeys.list({ page: 1, pageSize: 50 }),
    queryFn: async () => {
      const result = await getOrganizationsFn({ data: { page: 1, pageSize: 50 } })
      return result
    },
    enabled: !isEdit && open,
  })

  const users = usersData?.items ?? []
  const organizations = orgsData?.items ?? []

  const formSchema = useMemo(() => {
    if (isEdit) {
      return z.object({
        organizationId: z.string().optional(), // 用于 watch
        userId: z.string().optional(), // 用于 watch
        role: z.string().min(1, '角色不能为空'),
        departmentId: z.string().optional(),
      })
    }
    return z.object({
      organizationId: z.string().min(1, '组织不能为空'),
      userId: z.string().min(1, '用户不能为空'),
      role: z.string().min(1, '角色不能为空'),
      departmentId: z.string().optional(),
    })
  }, [isEdit])

  type MemberForm = z.infer<typeof formSchema>

  const toFormValues = useCallback(
    (row?: Member): MemberForm => {
      if (isEdit) {
        return {
          organizationId: row?.organizationId,
          userId: row?.userId,
          role: row?.role ?? '',
          departmentId: row?.departmentId || undefined,
        }
      }
      return {
        organizationId: row?.organizationId ?? '',
        userId: row?.userId ?? '',
        role: row?.role ?? 'member',
        departmentId: row?.departmentId || undefined,
      }
    },
    [isEdit]
  )

  const form = useForm<MemberForm>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => toFormValues(currentRow), [currentRow, toFormValues]),
  })

  const selectedOrganizationId = useWatch({
    control: form.control,
    name: 'organizationId',
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(currentRow))
    }
  }, [open, currentRow, form, toFormValues])

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: MemberForm) => {
      return await createMemberFn({ data: data as any })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: MemberForm) => {
      if (!currentRow) {
        throw new Error('缺少当前成员信息')
      }

      return await updateMemberFn({
        data: {
          id: currentRow.id,
          role: data.role,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: MemberForm) => {
    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? '保存中...' : '添加中...',
      success: isEdit ? '成员更新成功' : '成员添加成功',
      error: (error) => {
        return getErrorMessage(error)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑成员' : '添加成员'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改成员角色。' : '添加新成员到组织。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='member-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name='organizationId'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>组织 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className='col-span-4'>
                              <SelectValue placeholder='选择组织' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map((org: { id: string; name: string }) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='userId'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>用户 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className='col-span-4'>
                              <SelectValue placeholder='选择用户' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: { id: string; name: string; email: string }) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isEdit && (
                <>
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>用户</FormLabel>
                    <div className='col-span-4'>
                      <Input value={`${currentRow?.username} (${currentRow?.email})`} disabled />
                    </div>
                  </FormItem>

                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>组织</FormLabel>
                    <div className='col-span-4'>
                      <Input value={currentRow?.organizationName} disabled />
                    </div>
                  </FormItem>
                </>
              )}

              <FormField
                control={form.control}
                name='departmentId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>部门</FormLabel>
                    <div className='col-span-4'>
                      <DepartmentSelector
                        organizationId={isEdit ? currentRow?.organizationId ?? '' : selectedOrganizationId || ''}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色（兼容）*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='col-span-4'>
                          <SelectValue placeholder='选择角色' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='owner'>Owner</SelectItem>
                        <SelectItem value='admin'>Admin</SelectItem>
                        <SelectItem value='member'>Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type='submit' form='member-form'>
            {isEdit ? '保存' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
