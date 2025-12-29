import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// 过滤出所有可用的图标组件
const iconList = Object.keys(LucideIcons || {})
  .filter(
    (name) =>
      // 只保留首字母大写的（组件命名规范）
      /^[A-Z]/.test(name) &&
      // 排除 Icon 后缀的别名（只保留原始名称）
      !name.endsWith('Icon') &&
      // 排除特殊的导出
      name !== 'createLucideIcon' &&
      name !== 'default'
  )
  .sort()

export interface IconPickerProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

// 图标项组件 - 使用 memo 避免重复渲染
const IconItem = React.memo(
  ({ iconName, isSelected, onSelect }: { iconName: string; isSelected: boolean; onSelect: (name: string) => void }) => {
    const IconComponent = LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as React.ComponentType<LucideIcons.LucideProps>

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='flex h-12 flex-col items-center justify-center gap-1 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
            onClick={() => onSelect(iconName)}
          >
            {React.createElement(IconComponent, {
              className: cn('size-5', isSelected && 'text-primary'),
            })}
            <span className='sr-only'>{iconName}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          {iconName}
        </TooltipContent>
      </Tooltip>
    )
  }
)
IconItem.displayName = 'IconItem'

export const IconPicker = React.memo(function IconPicker({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder = '选择图标',
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  const selectedIcon = value
    ? (LucideIcons[value as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>)
    : null

  // 防抖搜索
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 150)
    return () => clearTimeout(timer)
  }, [search])

  // 优化：限制显示数量，搜索时显示更多
  const filteredIcons = React.useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase()
    const filtered = debouncedSearch ? iconList.filter((name) => name.toLowerCase().includes(lowerSearch)) : iconList

    // 如果没有搜索，只显示前 300 个（性能优化）
    // 如果有搜索，显示所有匹配结果（但限制 500 个）
    return debouncedSearch ? filtered.slice(0, 500) : filtered.slice(0, 300)
  }, [debouncedSearch])

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const COLUMN_COUNT = 6
  const rowCount = Math.ceil(filteredIcons.length / COLUMN_COUNT)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 6,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end : 0

  const handleSelect = React.useCallback(
    (iconName: string) => {
      onValueChange?.(iconName)
      setOpen(false)
      setSearch('')
    },
    [onValueChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedIcon ? (
            <div className='flex items-center gap-2'>
              {React.createElement(selectedIcon, { className: 'size-4' })}
              <span className='truncate'>{value}</span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <LucideIcons.Sparkles className='size-4' />
              <span>{placeholder}</span>
            </div>
          )}
          <LucideIcons.ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[320px] p-0' align='start'>
        <div className='flex flex-col'>
          <div className='border-b p-3'>
            <Input
              placeholder='搜索图标...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-9'
            />
          </div>
          <div ref={scrollRef} className='max-h-[300px] overflow-y-auto p-2'>
            {filteredIcons.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>未找到图标</p>
            ) : (
              <TooltipProvider delayDuration={300}>
                <div style={{ paddingTop, paddingBottom }}>
                  {virtualRows.map((virtualRow) => {
                    const startIndex = virtualRow.index * COLUMN_COUNT
                    const rowIcons = filteredIcons.slice(startIndex, startIndex + COLUMN_COUNT)
                    return (
                      <div
                        key={virtualRow.key}
                        className='grid grid-cols-6 gap-1'
                        style={{ height: `${virtualRow.size}px` }}
                      >
                        {rowIcons.map((iconName) => (
                          <IconItem
                            key={iconName}
                            iconName={iconName}
                            isSelected={value === iconName}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </TooltipProvider>
            )}
          </div>

          {filteredIcons.length > 0 && (
            <>
              {!debouncedSearch && filteredIcons.length === 300 && (
                <p className='px-2 pb-2 text-center text-xs text-muted-foreground'>
                  显示前 300 个图标，使用搜索查找更多...
                </p>
              )}
              {debouncedSearch && filteredIcons.length === 500 && (
                <p className='px-2 pb-2 text-center text-xs text-muted-foreground'>已显示 500 个结果，请细化搜索...</p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})



