import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import type { Tab, TabStateContextValue, TabActionContextValue, TabScope } from '@/shared/types/tab-types'
import { MAX_TABS } from '@/shared/types/tab-types'

const TabStateContext = createContext<TabStateContextValue | undefined>(undefined)
const TabActionContext = createContext<TabActionContextValue | undefined>(undefined)

const STORAGE_KEY = 'admin-tabs'

export function TabProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()
    type NavigateTo = Parameters<typeof navigate>[0]['to']

    // 根据 URL 自动计算当前的 Scope
    const currentScope = useMemo((): TabScope => {
        return location.pathname.startsWith('/admin') ? 'ADMIN' : 'APP'
    }, [location.pathname])

    const getDefaultTabs = (): Tab[] => [
        { id: 'tab-dashboard-app', title: '控制台', path: '/dashboard', order: -1, closable: false, sortable: false, scope: 'APP', icon: undefined },
        { id: 'tab-dashboard-admin', title: '系统概览', path: '/admin/dashboard', order: -1, closable: false, sortable: false, scope: 'ADMIN', icon: undefined },
    ]

    // SSR 期间只用默认值，避免 localStorage 导致 hydration mismatch
    const [tabs, setTabs] = useState<Tab[]>(() => getDefaultTabs())

    // 过滤出当前 Scope 下的 tabs
    const scopedTabs = useMemo(() => {
        return tabs.filter(t => t.scope === currentScope)
    }, [tabs, currentScope])

    // 打开新标签页或激活已存在的标签页
    const openTab = useCallback(
        (path: string | undefined, title: string, icon?: React.ElementType | string): boolean => {
            if (!path) return false

            const targetScope: TabScope = path.startsWith('/admin') ? 'ADMIN' : 'APP'
            const existingTab = tabs.find((tab) => tab.path === path)

            if (existingTab) {
                if (!location.pathname.startsWith(path)) {
                    navigate({ to: path as NavigateTo })
                }
                return true
            }

            if (tabs.length >= MAX_TABS) {
                console.warn(`已达到最大标签页数量限制 (${MAX_TABS})`)
                return false
            }

            const newTab: Tab = {
                id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title,
                path,
                icon,
                order: tabs.length,
                closable: true,
                sortable: true,
                scope: targetScope,
            }

            setTabs((prev) => [...prev, newTab])
            if (!location.pathname.startsWith(path)) {
                navigate({ to: path as NavigateTo })
            }
            return true
        },
        [tabs, navigate, location.pathname]
    )

    const activeTabId = useMemo(() => {
        // 1. 处理 /admin 首页路径，映射到 dashboard
        const normalizedPath = location.pathname === '/admin' ? '/admin/dashboard' : location.pathname

        // 2. 优先根据当前路径匹配已有的 Tab（考虑 scope）
        let matchingTab = scopedTabs.find((tab) => tab.path === normalizedPath)

        // 3. 如果没有精确匹配，尝试匹配父级路径（针对设置页等嵌套页面）
        if (!matchingTab) {
            if (normalizedPath.startsWith('/admin/profile/settings')) {
                matchingTab = scopedTabs.find((tab) => tab.path === '/admin/profile/settings')
            }
        }

        if (matchingTab) return matchingTab.id
        return null
    }, [scopedTabs, location.pathname])

    // 辅助函数：根据路径推断标题
    const getTitleForPath = useCallback((path: string): string => {
        // 常规路径映射
        const titleMap: Record<string, string> = {
            '/admin/dashboard': '系统概览',
            '/admin/users': '用户管理',
            '/admin/roles': '角色管理',
            '/admin/log': '系统日志',
            '/admin/profile/settings': '账号设置',
            '/admin/settings': '系统设置',
            '/admin/identity/users': '用户列表',
            '/admin/identity/roles': '权限分配',
        }

        if (titleMap[path]) return titleMap[path]

        // 智能推断：提取路径最后一段
        const segments = path.split('/').filter(Boolean)
        const lastSegment = segments[segments.length - 1]

        if (lastSegment) {
            // 常见词库翻译
            const segmentMap: Record<string, string> = {
                'settings': '设置',
                'profile': '个人资料',
                'dashboard': '概览',
                'users': '用户',
                'roles': '角色',
                'permissions': '权限',
                'log': '日志',
                'audit': '审计',
                'account': '账户',
                'security': '安全',
                'identity': '身份认证',
                'system': '系统',
            }

            if (segmentMap[lastSegment.toLowerCase()]) {
                return segmentMap[lastSegment.toLowerCase()]
            }

            // 兜底：首字母大写
            return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
        }

        return '详情页'
    }, [])

    // 自动打开标签页逻辑
    useEffect(() => {
        let path = location.pathname === '/admin' ? '/admin/dashboard' : location.pathname

        // 特殊处理：设置页及其子页面统统归类到 /admin/profile/settings 标签
        if (path.startsWith('/admin/profile/settings')) {
            path = '/admin/profile/settings'
        }

        // 只处理对应的 Scope
        const targetScope: TabScope = path.startsWith('/admin') ? 'ADMIN' : 'APP'
        if (targetScope !== currentScope) return

        const existingTab = tabs.find((tab) => tab.path === path)
        if (!existingTab) {
            const title = getTitleForPath(path)
            openTab(path, title)
        }
    }, [location.pathname, tabs, openTab, currentScope, getTitleForPath])

    // 客户端从 localStorage 恢复 tabs
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (!stored) return

            const parsed = JSON.parse(stored) as Tab[]
            const restored = parsed.map((tab) => ({ ...tab, icon: undefined }))
            const merged = [...restored]

            // 确保 APP Dashboard 始终存在
            if (!merged.find((t) => t.path === '/dashboard' && t.scope === 'APP')) {
                merged.push({
                    id: 'tab-dashboard-app',
                    title: '控制台',
                    path: '/dashboard',
                    order: -1,
                    closable: false,
                    sortable: false,
                    scope: 'APP',
                    icon: undefined,
                })
            }

            // 确保 ADMIN Dashboard 始终存在
            if (!merged.find((t) => t.path === '/admin/dashboard' && t.scope === 'ADMIN')) {
                merged.push({
                    id: 'tab-dashboard-admin',
                    title: '系统概览',
                    path: '/admin/dashboard',
                    order: -1,
                    closable: false,
                    sortable: false,
                    scope: 'ADMIN',
                    icon: undefined,
                })
            }

            // eslint-disable-next-line
            setTabs(merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
        } catch {
            setTabs(getDefaultTabs())
        }
    }, [])

    // 持久化 tabs 到 localStorage
    useEffect(() => {
        try {
            // 移除 icon 属性再保存，因为 React 组件无法序列化
            const tabsToSave = tabs.map(({ icon: _icon, ...rest }) => rest)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tabsToSave))
        } catch (error) {
            console.error('Failed to save tabs to localStorage:', error)
        }
    }, [tabs])

    // 关闭标签页
    const closeTab = useCallback(
        (tabId: string) => {
            const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
            if (tabIndex === -1) return

            // 不可关闭的标签页直接返回
            if (tabs[tabIndex].closable === false) return

            const newTabs = tabs.filter((tab) => tab.id !== tabId)
            setTabs(newTabs)

            // 如果关闭的是当前激活的标签页
            const closedTab = tabs[tabIndex]
            if (location.pathname === closedTab.path) {
                // 过滤出当前作用域下的新标签列表
                const currentScopedNewTabs = newTabs.filter(t => t.scope === currentScope)
                if (currentScopedNewTabs.length > 0) {
                    // 找到原本位置相邻的标签
                    const scopedTabIndex = scopedTabs.findIndex(t => t.id === tabId)
                    const nextTab = currentScopedNewTabs[scopedTabIndex] || currentScopedNewTabs[scopedTabIndex - 1]
                    if (nextTab) {
                        navigate({ to: nextTab.path as NavigateTo })
                    }
                }
            }
        },
        [tabs, currentScope, scopedTabs, navigate, location.pathname]
    )

    // 激活标签页
    const activateTab = useCallback(
        (tabId: string) => {
            const tab = tabs.find((t) => t.id === tabId)
            if (tab && location.pathname !== tab.path) {
                navigate({ to: tab.path as NavigateTo })
            }
        },
        [tabs, navigate, location.pathname]
    )

    // 关闭其他标签页
    const closeOtherTabs = useCallback(
        (tabId: string) => {
            const protectedTabs = tabs.filter(t => t.closable === false || t.id === tabId)
            setTabs(protectedTabs.map((t, index) => ({ ...t, order: index })))
        },
        [tabs]
    )

    // 关闭右侧标签页
    const closeTabsToRight = useCallback(
        (tabId: string) => {
            const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
            if (tabIndex !== -1) {
                const protectedTabs = tabs.filter((t, index) => t.closable === false || index <= tabIndex)
                setTabs(protectedTabs)
            }
        },
        [tabs]
    )

    // 关闭所有标签页
    const closeAllTabs = useCallback(() => {
        const protectedTabs = tabs.filter(t => t.closable === false)
        setTabs(protectedTabs)
        const currentScopedDashboard = protectedTabs.find(t => t.scope === currentScope && t.order === -1)
        if (currentScopedDashboard) {
            navigate({ to: currentScopedDashboard.path as NavigateTo })
        }
    }, [tabs, navigate, currentScope])

    // 重新排序标签页（用于拖拽）
    const reorderTabs = useCallback((startIndex: number, endIndex: number) => {
        setTabs((prev) => {
            // 如果涉及到不可拖拽的标签，不进行排序
            if (prev[startIndex].sortable === false || prev[endIndex].sortable === false) {
                return prev
            }

            const result = Array.from(prev)
            const [removed] = result.splice(startIndex, 1)
            result.splice(endIndex, 0, removed)

            // 更新 order 字段
            return result.map((tab, index) => ({ ...tab, order: index }))
        })
    }, [])

    const stateValue: TabStateContextValue = useMemo(() => ({
        tabs: scopedTabs,
        activeTabId,
        maxTabs: MAX_TABS,
    }), [scopedTabs, activeTabId])

    const actionValue: TabActionContextValue = useMemo(() => ({
        openTab,
        closeTab,
        activateTab,
        closeOtherTabs,
        closeTabsToRight,
        closeAllTabs,
        reorderTabs,
    }), [openTab, closeTab, activateTab, closeOtherTabs, closeTabsToRight, closeAllTabs, reorderTabs])


    return (
        <TabStateContext.Provider value={stateValue}>
            <TabActionContext.Provider value={actionValue}>
                {children}
            </TabActionContext.Provider>
        </TabStateContext.Provider>
    )
}

export function useTabState() {
    const context = useContext(TabStateContext)
    if (context === undefined) {
        throw new Error('useTabState must be used within a TabProvider.')
    }
    return context
}

export function useTabActions() {
    const context = useContext(TabActionContext)
    if (context === undefined) {
        throw new Error('useTabActions must be used within a TabProvider.')
    }
    return context
}

// Deprecated: Kept for backwards compatibility but shouldn't be used for new code
export function useTabs() {
    const state = useTabState()
    const actions = useTabActions()
    return { ...state, ...actions }
}

export function useTabsRequired() {
    return useTabs()
}
