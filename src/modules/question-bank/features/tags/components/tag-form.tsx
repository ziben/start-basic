import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Tag, CreateTagData } from '../../../shared/services/qb-api-client'
import { useCreateTag, useUpdateTag } from '../../../shared/hooks/use-tags-api'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(1, '请输入标签名称'),
  color: z.string().optional().default(''),
})

type FormValues = z.infer<typeof formSchema>

interface TagFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Tag
}

export function TagForm({
  open,
  onOpenChange,
  initialData,
}: TagFormProps) {
  const isEditing = !!initialData
  const createMutation = useCreateTag()
  const updateMutation = useUpdateTag()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      color: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          color: initialData.color || '',
        })
      } else {
        form.reset({
          name: '',
          color: '',
        })
      }
    }
  }, [open, initialData, form])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const submitData: CreateTagData = {
      name: values.name,
      color: values.color || undefined,
    }

    const promise = isEditing
      ? updateMutation.mutateAsync({ id: initialData!.id, data: submitData })
      : createMutation.mutateAsync(submitData)

    toast.promise(promise, {
      loading: isEditing ? '正在更新...' : '正在创建...',
      success: () => {
        onOpenChange(false)
        return isEditing ? '标签已更新' : '标签已创建'
      },
      error: (err: any) => err.message || '操作失败',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑标签' : '新建标签'}</DialogTitle>
          <DialogDescription>
            管理题库标签，用于题目的分类搜索。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签名称</FormLabel>
                  <FormControl>
                    <Input placeholder='输入标签名称' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>颜色 (可选)</FormLabel>
                  <FormControl>
                    <div className='flex space-x-2'>
                      <Input placeholder='#000000' {...field} className='flex-1' />
                      <Input 
                        type='color' 
                        value={field.value || '#000000'} 
                        onChange={(e) => field.onChange(e.target.value)}
                        className='w-12 p-1 h-10'
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                确定
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

