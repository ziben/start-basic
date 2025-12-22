import * as React from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { IconPicker } from '@/components/icon-picker'

// 表单验证 schema
const formSchema = z.object({
  name: z.string().min(1, '请输入名称'),
  icon: z.string().min(1, '请选择图标'),
})

type FormValues = z.infer<typeof formSchema>

export function IconPickerDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: '',
    },
  })

  const onSubmit = (values: FormValues) => {
    console.log('Form values:', values)
    toast.success('提交成功！', {
      description: `名称: ${values.name}, 图标: ${values.icon}`,
    })
  }

  const selectedIcon = form.watch('icon')
  const SelectedIconComponent = selectedIcon
    ? (LucideIcons[selectedIcon as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>)
    : null

  return (
    <div className='mx-auto max-w-2xl space-y-8 p-6'>
      <div>
        <h2 className='text-2xl font-bold'>图标选择器示例</h2>
        <p className='text-muted-foreground mt-2'>在表单中使用图标选择器组件</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormControl>
                  <Input placeholder='输入名称' {...field} />
                </FormControl>
                <FormDescription>输入项目或功能的名称</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='icon'
            render={({ field }) => (
              <FormItem>
                <FormLabel>图标</FormLabel>
                <FormControl>
                  <IconPicker value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormDescription>从 Lucide 图标库中选择一个图标</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedIcon && SelectedIconComponent && (
            <div className='bg-muted rounded-lg p-4'>
              <p className='text-muted-foreground mb-3 text-sm font-medium'>预览效果</p>
              <div className='flex items-center gap-4'>
                <div className='bg-background flex size-16 items-center justify-center rounded-lg border'>
                  {React.createElement(SelectedIconComponent, {
                    className: 'size-8',
                  })}
                </div>
                <div>
                  <p className='font-medium'>{form.getValues('name') || '未命名'}</p>
                  <p className='text-muted-foreground text-sm'>{selectedIcon}</p>
                </div>
              </div>
            </div>
          )}

          <div className='flex gap-4'>
            <Button type='submit'>提交</Button>
            <Button type='button' variant='outline' onClick={() => form.reset()}>
              重置
            </Button>
          </div>
        </form>
      </Form>

      {/* 简单用法示例 */}
      <div className='space-y-4 border-t pt-8'>
        <h3 className='text-lg font-semibold'>简单用法</h3>
        <p className='text-muted-foreground text-sm'>不使用表单库的基本示例</p>
        <SimpleExample />
      </div>
    </div>
  )
}

function SimpleExample() {
  const [selectedIcon, setSelectedIcon] = React.useState('')

  const IconComponent = selectedIcon
    ? (LucideIcons[selectedIcon as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>)
    : null

  return (
    <div className='space-y-4'>
      <IconPicker value={selectedIcon} onValueChange={setSelectedIcon} placeholder='选择一个图标' />

      {selectedIcon && IconComponent && (
        <div className='bg-muted flex items-center gap-3 rounded-lg p-4'>
          {React.createElement(IconComponent, { className: 'size-6' })}
          <span className='text-sm'>已选择: {selectedIcon}</span>
          <Button size='sm' variant='ghost' onClick={() => setSelectedIcon('')} className='ml-auto'>
            清除
          </Button>
        </div>
      )}
    </div>
  )
}
