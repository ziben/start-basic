import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SortableTabProps {
    tab: Tab
    isActive: boolean
    onActivate: () => void
    onClose: () => void
    onCloseOthers: () => void
}

function SortableTab({ tab, isActive, onActivate, onClose, onCloseOthers }: SortableTabProps) {
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
        <DropdownMenu>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    'group relative flex h-9 min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-3 transition-all duration-200 ease-in-out',
                    isActive
                        ? 'border-primary bg-background text-foreground shadow-sm'
                        : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                    tab.sortable === false && 'cursor-default'
                )}
                {...(tab.sortable !== false ? attributes : {})}
                {...(tab.sortable !== false ? listeners : {})}
            >
                <div className="flex flex-1 items-center gap-2 min-w-0">
                    <div className="flex flex-1 items-center gap-2 min-w-0" onClick={onActivate}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="flex-1 truncate text-sm font-medium">{tab.title}</span>
                    </div>
                </div>
                {tab.closable !== false && (
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'shrink-0 rounded-sm p-0.5 opacity-0 transition-all duration-200 hover:bg-accent group-hover:opacity-100',
                                isActive && 'opacity-100'
                            )}
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                )}
                {tab.closable !== false && (
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClose}>关闭标签页</DropdownMenuItem>
                        <DropdownMenuItem onClick={onCloseOthers}>关闭其他标签页</DropdownMenuItem>
                    </DropdownMenuContent>
                )}
            </div>
        </DropdownMenu>
    )
}

export function TabBar() {
    const tabContext = useTabs()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line
        setIsMounted(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 拖拽 8px 后才激活，避免误触
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

    const { tabs, activeTabId, activateTab, closeTab, closeOtherTabs } = tabContext

    return (
        <div className="border-b bg-muted/30">
            <div className="flex items-center gap-1 px-2 pt-2">
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
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )
}
