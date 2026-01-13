export const MAX_TABS = 10 // 最大标签页数量

export type TabScope = 'APP' | 'ADMIN'

export interface Tab {
    id: string
    title: string
    path: string
    icon?: React.ElementType | string
    order: number // 用于拖拽排序
    closable?: boolean // 是否可关闭
    sortable?: boolean // 是否可拖拽排序
    scope: TabScope // 标签作用域
}

export interface TabContextValue {
    tabs: Tab[]
    activeTabId: string | null
    maxTabs: number
    openTab: (path: string | undefined, title: string, icon?: React.ElementType | string) => boolean
    closeTab: (tabId: string) => void
    activateTab: (tabId: string) => void
    closeOtherTabs: (tabId: string) => void
    closeAllTabs: () => void
    reorderTabs: (startIndex: number, endIndex: number) => void
}
