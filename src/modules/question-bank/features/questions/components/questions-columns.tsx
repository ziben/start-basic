import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { Question } from '../../../shared/services/qb-api-client'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Question>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const labels: Record<string, string> = {
        single: '单选题',
        multiple: '多选题',
        true_false: '判断题',
        fill_in: '填空题',
        essay: '简答题',
      }
      return <div className='w-[80px]'>{labels[type] || type}</div>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'content',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='内容' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='max-w-[500px] truncate font-medium'>
            {row.getValue('content')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='分类' />
    ),
    cell: ({ row }) => {
      const category = row.original.category
      if (!category) return null
      return (
        <Badge variant='outline' className='font-normal'>
          {category.name}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='难度' />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue('difficulty') as number
      return (
        <div className='flex items-center'>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 w-2 rounded-full mr-1',
                i < difficulty ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div className='w-[100px] text-muted-foreground'>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

