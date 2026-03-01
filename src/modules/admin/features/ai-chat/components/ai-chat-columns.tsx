/**
 * AI Chat Admin - 列定义
 */

import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import type { AIConversationItem } from '../hooks/use-ai-chat-query'

function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

interface UseAIChatColumnsProps {
    onView: (id: string) => void
    onDelete: (id: string) => void
}

export function useAIChatColumns({ onView, onDelete }: UseAIChatColumnsProps): ColumnDef<AIConversationItem>[] {
    return [
        {
            accessorKey: 'title',
            size: 280,
            header: ({ column }) => <DataTableColumnHeader column={column} title='标题' />,
            cell: ({ row }) => (
                <span className='font-medium'>{row.getValue('title')}</span>
            ),
            meta: { title: '标题' },
        },
        {
            accessorKey: 'userName',
            size: 140,
            header: '用户',
            cell: ({ row }) => {
                const name = row.getValue('userName') as string | null
                const email = row.original.userEmail
                return (
                    <div className='flex flex-col'>
                        <span>{name || '-'}</span>
                        {email && <span className='text-xs text-muted-foreground'>{email}</span>}
                    </div>
                )
            },
            meta: { title: '用户' },
        },
        {
            accessorKey: 'messageCount',
            size: 100,
            header: ({ column }) => <DataTableColumnHeader column={column} title='消息数' />,
            cell: ({ row }) => row.getValue('messageCount'),
            meta: { title: '消息数', className: 'text-center' },
        },
        {
            accessorKey: 'createdAt',
            size: 180,
            header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
            cell: ({ row }) => formatDate(row.getValue('createdAt')),
            meta: { title: '创建时间' },
        },
        {
            accessorKey: 'updatedAt',
            size: 180,
            header: ({ column }) => <DataTableColumnHeader column={column} title='最后活跃' />,
            cell: ({ row }) => formatDate(row.getValue('updatedAt')),
            meta: { title: '最后活跃' },
        },
        {
            id: 'actions',
            size: 120,
            cell: ({ row }) => (
                <div className='flex items-center justify-end gap-1'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => onView(row.original.id)}
                        title='查看详情'
                    >
                        <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-destructive'
                        onClick={() => onDelete(row.original.id)}
                        title='删除会话'
                    >
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            meta: { className: 'text-right', title: '操作' },
        },
    ]
}
