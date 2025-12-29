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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Category, CreateCategoryData } from '../../../shared/services/qb-api-client'
import { useCreateCategory, useUpdateCategory } from '../../../shared/hooks/use-categories-api'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(1, '请输入分类名称'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
})

type FormValues = {
  name: string
  description?: string
  parentId?: string | null
  orderIndex?: number
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Category
  parentId?: string
}

export function CategoryForm({
  open,
  onOpenChange,
  initialData,
  parentId,
}: CategoryFormProps) {
  const isEditing = !!initialData
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      parentId: null,
      orderIndex: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || '',
          parentId: initialData.parentId,
          orderIndex: initialData.orderIndex,
        })
      } else {
        form.reset({
          name: '',
          description: '',
          parentId: parentId || null,
          orderIndex: 0,
        })
      }
    }
  }, [open, initialData, parentId, form])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const submitData: CreateCategoryData = {
      name: values.name,
      description: values.description || undefined,
      parentId: values.parentId || null,
      orderIndex: values.orderIndex || 0,
    }
    
    const promise = isEditing
      ? updateMutation.mutateAsync({ id: initialData!.id, data: submitData })
      : createMutation.mutateAsync(submitData)

    toast.promise(promise, {
      loading: isEditing ? '正在更新...' : '正在创建...',
      success: () => {
        onOpenChange(false)
        return isEditing ? '分类已更新' : '分类已创建'
      },
      error: (err: any) => err.message || '操作失败',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑分类' : '新建分类'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改题目分类信息' : '在当前层级添加新的题目分类'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder='分类名称' {...field} />
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
                    <Textarea
                      placeholder='可选的分类描述'
                      className='resize-none'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='orderIndex'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序权重</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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

