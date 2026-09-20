/**
 * ChatbotPage
 *
 * AI 聊天主页：侧边栏（对话历史）+ 主聊天区
 */
import { useCallback, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { zhCN } from 'date-fns/locale'
import { Menu, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  useConversationMessagesQuery,
  useConversationsQuery,
  useDeleteConversation,
} from '~/modules/ai/shared/hooks/use-chat-history'
import { cn } from '~/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatInterface } from './components/chat-interface'
import { ChatSettings } from './components/chat-settings'

// ─── 时间格式化工具 ───────────────────────────────────────────────────────────

function formatConvTime(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'HH:mm', { locale: zhCN })
  if (isYesterday(d)) return '昨天'
  return format(d, 'MM-dd', { locale: zhCN })
}

// ─── 子组件：Skeleton 列表 ────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className='space-y-0.5 p-2'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='flex items-center gap-2.5 rounded-lg p-2.5'>
          <Skeleton className='h-4 w-4 shrink-0 rounded' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-3.5 w-full' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 子组件：单条对话 Item ────────────────────────────────────────────────────

interface ConvItemProps {
  id: string
  title: string
  updatedAt: string | Date
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

function ConvItem({ id, title, updatedAt, isActive, onSelect, onDelete, onRename }: ConvItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)

  const commitRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== title) {
      onRename(trimmed)
    } else {
      setEditValue(title)
    }
    setEditing(false)
  }

  return (
    <div
      onClick={() => !editing && onSelect()}
      className={cn(
        'group flex cursor-pointer items-center gap-2 rounded-lg p-2.5 transition-colors',
        isActive ? 'bg-secondary text-secondary-foreground' : 'text-foreground/80 hover:bg-secondary/50'
      )}
    >
      <MessageSquare
        className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}
      />

      <div className='min-w-0 flex-1'>
        {editing ? (
          <Input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setEditValue(title)
                setEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className='h-6 rounded px-1.5 py-0 text-xs'
          />
        ) : (
          <>
            <p className='truncate text-sm leading-tight font-medium'>{title}</p>
            <p className='mt-0.5 text-[11px] text-muted-foreground'>{formatConvTime(updatedAt)}</p>
          </>
        )}
      </div>

      {/* 操作按钮（hover 显示） */}
      {!editing && (
        <div className='flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
            title='重命名'
          >
            <Pencil className='h-3 w-3' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title='删除'
          >
            <Trash2 className='h-3 w-3' />
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────

export function ChatbotPage() {
  const queryClient = useQueryClient()
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const {
    data: conversationPages,
    isLoading: isLoadingConversations,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isError: conversationError,
  } = useConversationsQuery()
  const conversations = conversationPages?.pages.flat()
  const { data: messages, isLoading: isLoadingMessages } = useConversationMessagesQuery(activeConversationId)
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation()

  const activeTitle = activeConversationId
    ? (conversations?.find((c) => c.id === activeConversationId)?.title ?? '对话')
    : '新对话'

  // 刷新对话列表
  const refreshConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
  }, [queryClient])

  const handleNewChat = useCallback(() => {
    setActiveConversationId(undefined)
    setIsSidebarOpen(false)
  }, [])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setIsSidebarOpen(false)
  }, [])

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return
    deleteConversation(deleteTargetId, {
      onSuccess: () => {
        if (activeConversationId === deleteTargetId) {
          setActiveConversationId(undefined)
        }
        setDeleteTargetId(null)
      },
    })
  }

  const handleRename = useCallback(
    async (_id: string, _newTitle: string) => {
      // TODO: 实现重命名 API，目前仅本地刷新
      refreshConversations()
    },
    [refreshConversations]
  )

  // DB 消息 → UIMessage 格式
  const initialMessages = messages?.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant' | 'system',
    parts: [{ type: 'text' as const, content: m.content }],
  }))

  return (
    <TooltipProvider delayDuration={600}>
      <>
        {/* ── 布局容器 ──────────────────────────────────────────── */}
        <div className='container mx-auto h-[calc(100vh-4rem)] px-4 py-4 md:px-6'>
          <div className='relative flex h-full overflow-hidden rounded-xl border bg-background shadow-sm'>
            {/* ── 移动端遮罩 ───────────────────────────────────── */}
            {isSidebarOpen && (
              <div
                className='fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden'
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* ── 侧边栏 ──────────────────────────────────────── */}
            <aside
              className={cn(
                'absolute z-50 flex flex-col border-r bg-muted/20 md:relative',
                'h-full w-72 shrink-0',
                'transition-transform duration-300 ease-in-out',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              )}
            >
              {/* 侧边栏头部 */}
              <div className='flex shrink-0 items-center justify-between border-b bg-background/60 px-3 py-2.5 backdrop-blur-sm'>
                <span className='pl-1 text-sm font-semibold text-foreground/80'>对话历史</span>
                <div className='flex items-center gap-0.5'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleNewChat}>
                        <Plus className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>新建对话</TooltipContent>
                  </Tooltip>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 md:hidden'
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* 对话列表 */}
              <ScrollArea className='flex-1'>
                {isLoadingConversations ? (
                  <ConversationSkeleton />
                ) : !conversations?.length ? (
                  <div className='flex h-48 flex-col items-center justify-center gap-3 px-4 text-center'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted'>
                      <MessageSquare className='h-5 w-5 text-muted-foreground/50' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-foreground/70'>还没有对话记录</p>
                      <p className='mt-0.5 text-xs text-muted-foreground'>发送第一条消息开始吧</p>
                    </div>
                    <Button variant='outline' size='sm' onClick={handleNewChat} className='mt-1'>
                      <Plus className='mr-1 h-3.5 w-3.5' />
                      新建对话
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-0.5 p-2'>
                    {conversations.map((conv) => (
                      <ConvItem
                        key={conv.id}
                        id={conv.id}
                        title={conv.title}
                        updatedAt={conv.updatedAt}
                        isActive={activeConversationId === conv.id}
                        onSelect={() => handleSelectConversation(conv.id)}
                        onDelete={() => setDeleteTargetId(conv.id)}
                        onRename={(newTitle) => handleRename(conv.id, newTitle)}
                      />
                    ))}
                  </div>
                )}
                {conversationError && (
                  <p role='alert' className='p-2 text-sm text-destructive'>
                    对话加载失败，请重试
                  </p>
                )}
                {(hasNextPage || conversationError) && (
                  <Button
                    variant='ghost'
                    className='w-full'
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? '加载中…' : conversationError ? '重试' : '加载更多'}
                  </Button>
                )}
              </ScrollArea>
            </aside>

            {/* ── 主聊天区 ────────────────────────────────────── */}
            <main className='flex min-w-0 flex-1 flex-col bg-background'>
              {/* 顶部栏 */}
              <div className='flex shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur-sm'>
                <div className='flex min-w-0 items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='shrink-0 md:hidden'
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className='h-5 w-5' />
                  </Button>
                  <h1 className='truncate text-sm font-semibold text-foreground/90 md:text-base'>{activeTitle}</h1>
                </div>
                <ChatSettings />
              </div>

              {/* 聊天内容 */}
              <div className='min-h-0 flex-1'>
                {isLoadingMessages ? (
                  <div className='flex h-full items-center justify-center'>
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <div className='flex gap-1.5'>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className='h-2 w-2 animate-bounce rounded-full bg-primary/30'
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                      <span className='text-sm'>读取对话记录中...</span>
                    </div>
                  </div>
                ) : (
                  <ChatInterface
                    key={activeConversationId ?? 'new'}
                    conversationId={activeConversationId}
                    initialMessages={initialMessages}
                    onFirstMessage={refreshConversations}
                  />
                )}
              </div>
            </main>
          </div>
        </div>

        {/* ── 删除确认对话框 ──────────────────────────────────── */}
        <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除对话</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这条对话记录吗？此操作不可撤销，对话中的所有消息将被永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  )
}
