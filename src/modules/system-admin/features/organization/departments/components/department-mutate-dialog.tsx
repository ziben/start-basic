import { useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createDepartmentFn, updateDepartmentFn } from '../../../../shared/server-fns/department.fn'
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
import { departmentQueryKeys } from '~/shared/lib/query-keys'
import { type Department } from '../data/schema'

type DepartmentMutateDialogProps = {
  currentRow?: Department
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  departments: Department[]
}

export function DepartmentMutateDialog({
  currentRow,
  open,
  onOpenChange,
  organizationId,
  departments,
}: DepartmentMutateDialogProps) {
  const isEdit = !!currentRow

  const formSchema = useMemo(() => {
    return z.object({
      name: z.string().min(1, '部门名称不能为空'),
      code: z.string().min(1, '部门编码不能为空'),
      parentId: z.string().optional(),
      leader: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
      sort: z.number().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })
  }, [])

  type DepartmentForm = z.infer<typeof formSchema>

  const toFormValues = useCallback(
    (row?: Department): DepartmentForm => {
      const baseValues = {
        name: row?.name ?? '',
        code: row?.code ?? '',
        parentId: row?.parentId ?? undefined,
        leader: row?.leader ?? '',
        phone: row?.phone ?? '',
        email: row?.email ?? '',
        sort: row?.sort ?? 0,
      }
      
      if (isEdit) {
        return {
          ...baseValues,
          status: row?.status ?? 'ACTIVE',
        } as DepartmentForm
      }
      
      return baseValues as DepartmentForm
    },
    [isEdit]
  )

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => toFormValues(currentRow), [currentRow, toFormValues]),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(currentRow))
    }
  }, [open, currentRow, form, toFormValues])

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentForm) => {
      return await createDepartmentFn({
        data: {
          ...data,
          organizationId,
          email: data.email || undefined,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentQueryKeys.byOrg(organizationId) })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: DepartmentForm) => {
      if (!currentRow) {
        throw new Error('缺少当前部门信息')
      }

      return await updateDepartmentFn({
        data: {
          id: currentRow.id,
          ...data,
          email: data.email || undefined,
          parentId: data.parentId || null,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentQueryKeys.byOrg(organizationId) })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: DepartmentForm) => {
    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? '保存中...' : '创建中...',
      success: isEdit ? '部门更新成功' : '部门创建成功',
      error: (error) => {
        return getErrorMessage(error)
      },
    })
  }

  // 过滤可选的父部门（不能选择自己或自己的子部门）
  const availableParents = departments.filter((dept) => {
    if (!isEdit) return true
    if (!currentRow) return true
    // 不能选择自己
    if (dept.id === currentRow.id) return false
    // 不能选择自己的子部门
    if (dept.path.includes(currentRow.id)) return false
    return true
  })

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
          <DialogTitle>{isEdit ? '编辑部门' : '创建部门'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改部门信息。' : '创建新部门。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='department-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>部门名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入部门名称' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>部门编码 *</FormLabel>
                    <FormControl>
                      <Input placeholder='DEPT001' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>上级部门</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)} 
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className='col-span-4'>
                          <SelectValue placeholder='无（顶级部门）' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>无（顶级部门）</SelectItem>
                        {availableParents.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {'  '.repeat(dept.level - 1)}
                            {dept.name}
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
                name='leader'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>负责人</FormLabel>
                    <FormControl>
                      <Input placeholder='负责人姓名' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>联系电话</FormLabel>
                    <FormControl>
                      <Input placeholder='联系电话' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder='dept@example.com' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='sort'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>排序</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        className='col-span-4'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='col-span-4'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='ACTIVE'>启用</SelectItem>
                          <SelectItem value='INACTIVE'>停用</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type='submit' form='department-form'>
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
