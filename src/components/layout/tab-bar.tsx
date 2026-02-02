import { useEffect, useState } from 'react'
import { X, RefreshCcw, ArrowRightToLine, MinusCircle } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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
    onActivate: () => void
    onClose: () => void
    onCloseOthers: () => void
    onCloseToRight: () => void
}

function SortableTab({ tab, isActive, onActivate, onClose, onCloseOthers, onCloseToRight }: SortableTabProps) {
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
                        onClick={onActivate}
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
                                    onClose()
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </TabsTrigger>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => window.location.reload()}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    <span>刷新当前</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {tab.closable !== false && (
                    <ContextMenuItem onClick={onClose}>
                        <X className="mr-2 h-4 w-4" />
                        <span>关闭当前</span>
                    </ContextMenuItem>
                )}
                <ContextMenuItem onClick={onCloseOthers}>
                    <MinusCircle className="mr-2 h-4 w-4" />
                    <span>关闭其他</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={onCloseToRight}>
                    <ArrowRightToLine className="mr-2 h-4 w-4" />
                    <span>关闭右侧</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

export function TabBar() {
    const tabContext = useTabs()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        if (!tabContext) return

        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = tabContext.tabs.findIndex((tab) => tab.id === active.id)
            const newIndex = tabContext.tabs.findIndex((tab) => tab.id === over.id)
            tabContext.reorderTabs(oldIndex, newIndex)
        }
    }

    if (!isMounted || !tabContext || tabContext.tabs.length === 0) {
        return null
    }

    const { tabs, activeTabId, activateTab, closeTab, closeOtherTabs, closeTabsToRight } = tabContext

    return (
        <div className="hidden border-b bg-muted/30 backdrop-blur-sm md:block">
            <div className="flex h-11 items-center px-3">
                <Tabs value={activeTabId || ''} className="w-full">
                    <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-1 overflow-x-auto no-scrollbar">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={tabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
                                {tabs.map((tab) => (
                                    <SortableTab
                                        key={tab.id}
                                        tab={tab}
                                        isActive={tab.id === activeTabId}
                                        onActivate={() => activateTab(tab.id)}
                                        onClose={() => closeTab(tab.id)}
                                        onCloseOthers={() => closeOtherTabs(tab.id)}
                                        onCloseToRight={() => closeTabsToRight(tab.id)}
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
