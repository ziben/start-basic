import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'

export interface DetailField<TData> {
  /**
   * 字段唯一标识，通常对应数据对象的 key
   */
  id: string
  /**
   * 字段显示名称
   */
  label: React.ReactNode
  /**
   * 自定义渲染函数，如果未提供，则直接将 data[id] 转换为字符串显示
   */
  render?: (data: TData) => React.ReactNode
  /**
   * 在网格布局中占据的列数，默认为 1。例如设置为 2 则横跨整行（在 md 断点以上的 2 列布局中）
   */
  colSpan?: number
}

export interface DataDetailDialogProps<TData> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  data: TData | null
  fields: DetailField<TData>[]
  /**
   * 传递给 DialogContent 的 className
   */
  className?: string
  /**
   * 传递给包含字段的 grid 容器的 className
   */
  contentClassName?: string
}

export function DataDetailDialog<TData>({
  open,
  onOpenChange,
  title = '查看详情',
  description,
  data,
  fields,
  className,
  contentClassName,
}: DataDetailDialogProps<TData>): React.ReactElement {
  if (!data) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex max-h-[90vh] flex-col sm:max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className='-mr-4 flex-1 pr-4'>
          <div className={cn('grid grid-cols-1 gap-4 pb-4 md:grid-cols-2', contentClassName)}>
            {fields.map((field) => {
              const value = field.render ? field.render(data) : (data as Record<string, unknown>)[field.id]
              
              // 如果值为 undefined 或 null，可以不渲染该字段，或者显示一个占位符。这里选择显示连字符作为占位。
              const displayValue = value === undefined || value === null || value === '' ? '-' : value

              return (
                <div
                  key={field.id}
                  className={cn(
                    'space-y-1',
                    field.colSpan === 2 && 'md:col-span-2',
                    field.colSpan === 3 && 'md:col-span-3',
                    field.colSpan === 4 && 'md:col-span-4' // 根据需要支持的跨列数添加
                  )}
                >
                  <div className='text-sm font-medium text-muted-foreground'>{field.label}</div>
                  <div className='text-sm leading-relaxed'>{displayValue as React.ReactNode}</div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
