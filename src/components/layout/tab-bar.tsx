import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { X, RefreshCcw, ArrowRightToLine, MinusCircle } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from '@tanstack/react-router'
import { useTabs } from '@/shared/context/tab-context'
import type { Tab } from '@/shared/types/tab-types'
import { cn } from '@/shared/lib/utils'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SortableTabProps {
    tab: Tab
    isActive: boolean
    onActivate: (id: string) => void
    onClose: (id: string) => void
    onCloseOthers: (id: string) => void
    onCloseToRight: (id: string) => void
}

const SortableTab = memo(function SortableTab({ tab, isActive, onActivate, onClose, onCloseOthers, onCloseToRight }: SortableTabProps) {
    const router = useRouter()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: tab.id,
        disabled: tab.sortable === false,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const Icon = typeof tab.icon === 'string' ? null : tab.icon

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    style={style}
                    className={cn(
                        'relative flex-shrink-0 select-none outline-none',
                        isDragging && 'z-50'
                    )}
                    {...(tab.sortable !== false ? attributes : {})}
                    {...(tab.sortable !== false ? listeners : {})}
                >
                    <TabsTrigger
                        value={tab.id}
                        data-state={isActive ? 'active' : 'inactive'}
                        onClick={() => onActivate(tab.id)}
                        className={cn(
                            'relative h-8 min-w-[100px] max-w-[180px] gap-2 px-3 transition-all duration-200',
                            isActive
                                ? 'bg-background shadow-xs'
                                : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent'
                        )}
                    >
                        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />}
                        <span className="truncate text-xs font-medium">{tab.title}</span>
                        {tab.closable !== false && (
                            <button
                                className={cn(
                                    'ml-1 shrink-0 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted/80 group-hover:opacity-100',
                                    isActive && 'opacity-100'
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClose(tab.id)
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </TabsTrigger>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => router.invalidate()}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    <span>刷新当前</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {tab.closable !== false && (
                    <ContextMenuItem onClick={() => onClose(tab.id)}>
                        <X className="mr-2 h-4 w-4" />
                        <span>关闭当前</span>
                    </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => onCloseOthers(tab.id)}>
                    <MinusCircle className="mr-2 h-4 w-4" />
                    <span>关闭其他</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCloseToRight(tab.id)}>
                    <ArrowRightToLine className="mr-2 h-4 w-4" />
                    <span>关闭右侧</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
})

export function TabBar() {
    const tabContext = useTabs()
    const [isMounted, setIsMounted] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        if (!tabContext) return

        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = tabContext.tabs.findIndex((tab) => tab.id === active.id)
            const newIndex = tabContext.tabs.findIndex((tab) => tab.id === over.id)
            tabContext.reorderTabs(oldIndex, newIndex)
        }
    }, [tabContext])

    // 处理鼠标滚轮将垂直滚动转换为水平滚动
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (scrollRef.current && e.deltaY !== 0) {
            e.preventDefault()
            scrollRef.current.scrollLeft += e.deltaY
        }
    }, [])

    if (!isMounted || !tabContext || tabContext.tabs.length === 0) {
        // 返回与内容高度一致的空结构维持高度，防止闪烁 (Layout Shift)
        return <div className="hidden h-11 border-b bg-muted/30 backdrop-blur-sm md:block" />
    }

    const { tabs, activeTabId, activateTab, closeTab, closeOtherTabs, closeTabsToRight } = tabContext

    return (
        <div className="hidden border-b bg-muted/30 backdrop-blur-sm md:block">
            <div className="flex h-11 items-center px-3">
                <Tabs value={activeTabId || ''} className="w-full overflow-hidden">
                    <TabsList
                        ref={scrollRef}
                        onWheel={handleWheel}
                        className="h-9 w-full justify-start bg-transparent p-0 gap-1 overflow-x-auto no-scrollbar"
                    >
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={tabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
                                {tabs.map((tab) => (
                                    <SortableTab
                                        key={tab.id}
                                        tab={tab}
                                        isActive={tab.id === activeTabId}
                                        onActivate={activateTab}
                                        onClose={closeTab}
                                        onCloseOthers={closeOtherTabs}
                                        onCloseToRight={closeTabsToRight}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </TabsList>
                </Tabs>
            </div>
        </div>
    )
}
