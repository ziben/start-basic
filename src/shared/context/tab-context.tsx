import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import type { Tab, TabContextValue } from '@/shared/types/tab-types'
import { MAX_TABS } from '@/shared/types/tab-types'

const TabContext = createContext<TabContextValue | undefined>(undefined)

export function TabProvider({ children }: { children: React.ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([])
    const [activeTabId, setActiveTabId] = useState<string | null>(null)
    const navigate = useNavigate()
    const location = useLocation()

    // 从 URL 同步激活的标签页
    useEffect(() => {
        const currentPath = location.pathname
        const existingTab = tabs.find((tab) => tab.path === currentPath)

        if (existingTab && activeTabId !== existingTab.id) {
            setActiveTabId(existingTab.id)
        }
    }, [location.pathname, tabs, activeTabId])

    // 打开新标签页或激活已存在的标签页
    const openTab = useCallback(
        (path: string | undefined, title: string, icon?: React.ElementType | string): boolean => {
            // 验证路径
            if (!path) {
                console.warn('Invalid path provided to openTab')
                return false
            }

            // 检查是否已存在
            const existingTab = tabs.find((tab) => tab.path === path)

            if (existingTab) {
                // 激活已存在的标签页
                setActiveTabId(existingTab.id)
                navigate({ to: path } as any)
                return true
            }

            // 检查数量限制
            if (tabs.length >= MAX_TABS) {
                // TODO: 显示提示信息
                console.warn(`已达到最大标签页数量限制 (${MAX_TABS})`)
                return false
            }

            // 创建新标签页
            const newTab: Tab = {
                id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title,
                path,
                icon,
                order: tabs.length,
            }

            setTabs((prev) => [...prev, newTab])
            setActiveTabId(newTab.id)
            navigate({ to: path } as any)
            return true
        },
        [tabs, navigate]
    )

    // 关闭标签页
    const closeTab = useCallback(
        (tabId: string) => {
            const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
            if (tabIndex === -1) return

            const newTabs = tabs.filter((tab) => tab.id !== tabId)
            setTabs(newTabs)

            // 如果关闭的是激活的标签页，激活相邻的标签页
            if (activeTabId === tabId && newTabs.length > 0) {
                // 优先激活右侧的标签页，如果没有则激活左侧的
                const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1]
                if (nextTab) {
                    setActiveTabId(nextTab.id)
                    navigate({ to: nextTab.path } as any)
                }
            } else if (newTabs.length === 0) {
                setActiveTabId(null)
            }
        },
        [tabs, activeTabId, navigate]
    )

    // 激活标签页
    const activateTab = useCallback(
        (tabId: string) => {
            const tab = tabs.find((t) => t.id === tabId)
            if (tab) {
                setActiveTabId(tabId)
                // 只在当前路径不匹配时才导航，避免不必要的路由变化
                if (location.pathname !== tab.path) {
                    navigate({ to: tab.path } as any)
                }
            }
        },
        [tabs, navigate, location.pathname]
    )

    // 关闭其他标签页
    const closeOtherTabs = useCallback(
        (tabId: string) => {
            const tab = tabs.find((t) => t.id === tabId)
            if (tab) {
                setTabs([{ ...tab, order: 0 }])
                setActiveTabId(tabId)
            }
        },
        [tabs]
    )

    // 关闭所有标签页
    const closeAllTabs = useCallback(() => {
        setTabs([])
        setActiveTabId(null)
    }, [])

    // 重新排序标签页（用于拖拽）
    const reorderTabs = useCallback((startIndex: number, endIndex: number) => {
        setTabs((prev) => {
            const result = Array.from(prev)
            const [removed] = result.splice(startIndex, 1)
            result.splice(endIndex, 0, removed)

            // 更新 order 字段
            return result.map((tab, index) => ({ ...tab, order: index }))
        })
    }, [])

    const value: TabContextValue = {
        tabs,
        activeTabId,
        maxTabs: MAX_TABS,
        openTab,
        closeTab,
        activateTab,
        closeOtherTabs,
        closeAllTabs,
        reorderTabs,
    }

    return <TabContext.Provider value={value}>{children}</TabContext.Provider>
}

export function useTabs() {
    const context = useContext(TabContext)
    return context ?? null
}

// Hook that throws error if context is missing (for components that require tabs)
export function useTabsRequired() {
    const context = useContext(TabContext)
    if (context === undefined) {
        throw new Error('useTabsRequired must be used within a TabProvider. Make sure TabProvider wraps your component tree.')
    }
    return context
}
