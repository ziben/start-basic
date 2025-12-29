import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Question, CreateQuestionData } from '../../../shared/services/qb-api-client'
import { useCreateQuestion, useUpdateQuestion } from '../../../shared/hooks/use-questions-api'
import { useCategories } from '../../../shared/hooks/use-categories-api'
import { toast } from 'sonner'

const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'true_false', label: '判断题' },
  { value: 'fill_in', label: '填空题' },
  { value: 'essay', label: '简答题' },
]

const formSchema = z.object({
  type: z.string().min(1, '请选择题目类型'),
  content: z.string().min(1, '请输入题目内容'),
  categoryId: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).default(1),
  explanation: z.string().optional().default(''),
  // Options for choice questions
  options: z.array(z.object({
    label: z.string().min(1, '选项内容不能为空'),
    value: z.string().min(1, '选项值不能为空'),
  })).optional(),
  // Answer depends on type
  answer: z.any(),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Question
}

export function QuestionForm({
  open,
  onOpenChange,
  initialData,
}: QuestionFormProps) {
  const isEditing = !!initialData
  const createMutation = useCreateQuestion()
  const updateMutation = useUpdateQuestion()
  const { data: categories } = useCategories()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: 'single',
      content: '',
      categoryId: null,
      difficulty: 1,
      explanation: '',
      options: [
        { label: '', value: 'A' },
        { label: '', value: 'B' },
        { label: '', value: 'C' },
        { label: '', value: 'D' },
      ],
      answer: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  const questionType = form.watch('type')

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          type: initialData.type,
          content: initialData.content,
          categoryId: initialData.categoryId,
          difficulty: initialData.difficulty,
          explanation: initialData.explanation || '',
          options: initialData.options || [],
          answer: initialData.answer,
        })
      } else {
        form.reset({
          type: 'single',
          content: '',
          categoryId: null,
          difficulty: 1,
          explanation: '',
          options: [
            { label: '', value: 'A' },
            { label: '', value: 'B' },
            { label: '', value: 'C' },
            { label: '', value: 'D' },
          ],
          answer: '',
        })
      }
    }
  }, [open, initialData, form])

  // Handle type change defaults
  useEffect(() => {
    const currentType = form.getValues('type')
    if (currentType === 'true_false') {
      form.setValue('answer', 'true')
    } else if (currentType === 'multiple') {
      if (!Array.isArray(form.getValues('answer'))) {
        form.setValue('answer', [])
      }
    }
  }, [questionType, form])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const submitData: CreateQuestionData = {
      ...values,
      categoryId: values.categoryId || null,
    }

    const promise = isEditing
      ? updateMutation.mutateAsync({ id: initialData!.id, data: submitData })
      : createMutation.mutateAsync(submitData)

    toast.promise(promise, {
      loading: isEditing ? '正在更新...' : '正在创建...',
      success: () => {
        onOpenChange(false)
        return isEditing ? '题目已更新' : '题目已创建'
      },
      error: (err: any) => err.message || '操作失败',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑题目' : '新建题目'}</DialogTitle>
          <DialogDescription>
            填写题目详细信息，支持 Markdown 格式内容。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>题目类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择类型' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属分类</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择分类' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>无分类</SelectItem>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题目内容</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='输入题目描述，支持 Markdown' 
                      className='min-h-[100px]'
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(questionType === 'single' || questionType === 'multiple') && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <FormLabel>选项管理</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => append({ label: '', value: String.fromCharCode(65 + fields.length) })}
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    添加选项
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className='flex items-start space-x-2'>
                    <div className='mt-2 font-bold w-6'>{field.value}</div>
                    <FormField
                      control={form.control}
                      name={`options.${index}.label`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormControl>
                            <Input placeholder={`选项 ${field.name}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name='answer'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>正确答案</FormLabel>
                  <FormControl>
                    {questionType === 'single' ? (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='flex flex-wrap gap-4'
                      >
                        {fields.map((opt) => (
                          <div key={opt.value} className='flex items-center space-x-2'>
                            <RadioGroupItem value={opt.value} id={`answer-${opt.value}`} />
                            <label htmlFor={`answer-${opt.value}`}>{opt.value}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : questionType === 'multiple' ? (
                      <div className='flex flex-wrap gap-4'>
                        {fields.map((opt) => (
                          <div key={opt.value} className='flex items-center space-x-2'>
                            <Checkbox
                              id={`answer-${opt.value}`}
                              checked={(field.value as string[])?.includes(opt.value)}
                              onCheckedChange={(checked) => {
                                const current = (field.value as string[]) || []
                                if (checked) {
                                  field.onChange([...current, opt.value])
                                } else {
                                  field.onChange(current.filter((v) => v !== opt.value))
                                }
                              }}
                            />
                            <label htmlFor={`answer-${opt.value}`}>{opt.value}</label>
                          </div>
                        ))}
                      </div>
                    ) : questionType === 'true_false' ? (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='flex space-x-4'
                      >
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='true' id='answer-true' />
                          <label htmlFor='answer-true'>正确</label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='false' id='answer-false' />
                          <label htmlFor='answer-false'>错误</label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <Textarea 
                        placeholder='输入标准答案' 
                        {...field} 
                        value={field.value || ''}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='difficulty'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>难度 (1-5)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number' 
                      min={1} 
                      max={5} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='explanation'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>解析</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='输入题目解析' 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    学生在答题后可以看到该解析。
                  </FormDescription>
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

