import { Outlet } from '@tanstack/react-router'
import { useTabs } from '@/shared/context/tab-context'

export function TabContent() {
    const { tabs, activeTabId } = useTabs()

    // 如果没有打开的标签页，显示默认内容
    if (!tabs || tabs.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-muted-foreground">欢迎</h2>
                    <p className="mt-2 text-sm text-muted-foreground">请从左侧菜单选择一个页面开始</p>
                </div>
            </div>
        )
    }

    // 只渲染激活的标签页内容，提高性能
    return (
        <div
            key={activeTabId ?? 'tab-content'}
            className="relative flex h-full flex-col transition-opacity duration-150 ease-in-out"
        >
            <Outlet />
        </div>
    )
}
