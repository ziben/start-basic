import { Outlet } from '@tanstack/react-router'
import { MobileBottomNav } from './mobile-bottom-nav'

export function MobileLayout({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            {/* Main Content Area */}
            <main className="flex-1 pb-20">
                {children || <Outlet />}
            </main>

            {/* Bottom Navigation */}
            <MobileBottomNav />
        </div>
    )
}
