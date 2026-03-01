/**
 * AI Chat Admin - 主页面
 */

import { useState } from 'react'
import type { ReactElement } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { AIChatTable } from './components/ai-chat-table'
import { AIChatDetailDialog } from './components/ai-chat-detail-dialog'
import { useAIConversations, useDeleteAIConversation } from './hooks/use-ai-chat-query'
import { useTableUrlState } from '@/shared/hooks/use-table-url-state'

const route = getRouteApi('/_authenticated/admin/ai-chat')

export default function AdminAIChatPage(): ReactElement {
    const queryClient = useQueryClient()
    const search = route.useSearch()
    const navigate = route.useNavigate()

    const {
        globalFilter,
        onGlobalFilterChange,
        pagination,
        onPaginationChange,
    } = useTableUrlState({
        search,
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 20 },
        globalFilter: { enabled: true, key: 'filter' },
    })

    const { data, isLoading } = useAIConversations({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        filter: globalFilter,
    })

    const deleteMutation = useDeleteAIConversation()

    const [detailDialog, setDetailDialog] = useState<{ open: boolean; conversationId: string | null }>({
        open: false,
        conversationId: null,
    })

    const handleView = (id: string) => {
        setDetailDialog({ open: true, conversationId: id })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个会话吗？此操作不可恢复。')) return
        await deleteMutation.mutateAsync(id)
        void queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    }

    const handleCloseDetail = () => {
        setDetailDialog({ open: false, conversationId: null })
    }

    return (
        <AppHeaderMain fixed>
            <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>AI 会话管理</h2>
                    <p className='text-muted-foreground'>查看和管理用户的 AI 对话记录</p>
                </div>
            </div>

            <div className='-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1'>
                <AIChatTable
                    data={data?.items ?? []}
                    isLoading={isLoading}
                    search={search}
                    navigate={navigate}
                    onView={handleView}
                    onDelete={handleDelete}
                />
            </div>

            <AIChatDetailDialog
                conversationId={detailDialog.conversationId}
                open={detailDialog.open}
                onClose={handleCloseDetail}
            />
        </AppHeaderMain>
    )
}
