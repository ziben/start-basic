import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronsUpDown, Sparkles } from 'lucide-react'
import { availableIconNames, iconResolver } from '@/shared/utils/icon-resolver'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const iconList = availableIconNames

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
    const Icon = iconResolver(iconName) ?? Sparkles
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='flex h-12 flex-col items-center justify-center gap-1 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
            onClick={() => onSelect(iconName)}
          >
            <Icon className={cn('size-5', isSelected && 'text-primary')} />
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
  const SelectedIcon = iconResolver(value) ?? Sparkles

  const filteredIcons = React.useMemo(() => {
    const lowerSearch = search.toLowerCase()
    return search ? iconList.filter((name) => name.toLowerCase().includes(lowerSearch)) : iconList
  }, [search])

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
          {value ? (
            <div className='flex items-center gap-2'>
              <SelectedIcon className='size-4' />
              <span className='truncate'>{value}</span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Sparkles className='size-4' />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
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
        </div>
      </PopoverContent>
    </Popover>
  )
})
