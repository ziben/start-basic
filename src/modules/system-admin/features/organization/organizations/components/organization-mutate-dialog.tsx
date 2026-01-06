import { useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createOrganizationFn, updateOrganizationFn } from '../../../../shared/server-fns/organization.fn'
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
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { type Organization } from '../data/schema'
import { ORGANIZATIONS_QUERY_KEY } from '../hooks/use-organizations-list-query'

type OrganizationMutateDialogProps = {
  currentRow?: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrganizationMutateDialog({ currentRow, open, onOpenChange }: OrganizationMutateDialogProps) {
  const isEdit = !!currentRow

  const formSchema = useMemo(() => {
    return z.object({
      name: z.string().min(1, '组织名称不能为空').max(100, '组织名称不能超过100个字符'),
      slug: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^[a-z0-9-]+$/.test(val),
          '标识符只能包含小写字母、数字和连字符'
        ),
      logo: z.string().optional(),
      metadata: z.string().optional(),
    })
  }, [])

  type OrganizationForm = z.infer<typeof formSchema>

  const toFormValues = useCallback((row?: Organization): OrganizationForm => {
    return {
      name: row?.name ?? '',
      slug: row?.slug ?? '',
      logo: row?.logo ?? '',
      metadata: row?.metadata ?? '',
    }
  }, [])

  const form = useForm<OrganizationForm>({
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
    mutationFn: async (data: OrganizationForm) => {
      return await createOrganizationFn({ data })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      if (!currentRow) {
        throw new Error('缺少当前组织信息')
      }

      return await updateOrganizationFn({
        data: {
          id: currentRow.id,
          name: data.name,
          slug: data.slug,
          logo: data.logo,
          metadata: data.metadata,
        }
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: OrganizationForm) => {
    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? '保存中...' : '创建中...',
      success: isEdit ? '组织保存成功' : '组织创建成功',
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
          <DialogTitle>{isEdit ? '编辑组织' : '创建组织'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改组织信息。' : '创建新组织。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='organization-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>组织名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入组织名称' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>标识符</FormLabel>
                    <FormControl>
                      <Input placeholder='my-organization' className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='logo'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder='https://example.com/logo.png' className='col-span-4' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='metadata'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end pt-2'>元数据</FormLabel>
                    <FormControl>
                      <Textarea placeholder='JSON 格式的元数据' rows={3} className='col-span-4' {...field} />
                    </FormControl>
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
          <Button type='submit' form='organization-form'>
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
