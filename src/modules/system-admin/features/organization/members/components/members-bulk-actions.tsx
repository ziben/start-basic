import { type Table } from '@tanstack/react-table'
import { Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { type Member } from '../data/schema'
import { MembersMultiDeleteDialog } from './members-multi-delete-dialog'

type MembersBulkActionsProps = {
  table: Table<Member>
}

export function MembersBulkActions({ table }: MembersBulkActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) return null

  return (
    <div className='fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background p-4 shadow-lg'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>已选择 {selectedCount} 项</span>
        <Button variant='ghost' size='sm' onClick={() => table.toggleAllRowsSelected(false)}>
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div className='h-6 w-px bg-border' />

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            const data = selectedRows.map((row) => row.original)
            const csv = [
              ['用户名', '邮箱', '组织', '角色', '加入时间'].join(','),
              ...data.map((item) =>
                [item.username, item.email, item.organizationName, item.role, item.createdAt].join(',')
              ),
            ].join('\n')

            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `members-${Date.now()}.csv`
            a.click()
            URL.revokeObjectURL(url)

            toast.success(`已导出 ${selectedCount} 条记录`)
          }}
        >
          <Download className='mr-2 h-4 w-4' />
          导出
        </Button>

        <MembersMultiDeleteDialog table={table} selectedRows={selectedRows} />
      </div>
    </div>
  )
}
