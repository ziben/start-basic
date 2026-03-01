import * as React from 'react'
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Column } from '@tanstack/react-table'
import { useNavgroups, type NavGroup } from '~/modules/admin/features/navigation/navgroup/hooks/use-navgroup-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface IFacetOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface NavGroupFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
}

export function NavGroupFacetedFilter<TData, TValue>({ column, title }: NavGroupFacetedFilterProps<TData, TValue>) {
  const { t } = useTranslation()
  const { data: navgroups = [], isLoading } = useNavgroups()

  const options: IFacetOption[] = React.useMemo(() => {
    return navgroups.map((group: NavGroup) => ({
      label: t(`${group.title}`, { defaultMessage: group.title }),
      value: group.id,
    }))
  }, [navgroups, t])

  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircledIcon className='mr-2 h-4 w-4' />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
                {selectedValues.size}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {options
                  .filter((option: IFacetOption) => selectedValues.has(option.value))
                  .map((option: IFacetOption) => (
                    <Badge variant='secondary' key={option.value} className='rounded-sm px-1 font-normal'>
                      {option.label}
                    </Badge>
                  ))}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder={title || t('admin.navitem.filterByNavgroup')} />
          <CommandList>
            <CommandEmpty>{t('common.noResults')}</CommandEmpty>
            <CommandGroup>
              {isLoading && <CommandItem disabled>{t('common.loading')}</CommandItem>}
              {options.map((option: IFacetOption) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column?.setFilterValue(filterValues.length ? filterValues : undefined)
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && <option.icon className='mr-2 h-4 w-4 text-muted-foreground' />}
                    <span>{option.label}</span>
                    {/* Facets count can be added here if available and needed */}
                    {/* {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )} */}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className='justify-center text-center'
                  >
                    {t('common.clearFilters')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}






