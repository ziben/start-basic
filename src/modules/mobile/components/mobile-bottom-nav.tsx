import { Home, User, Settings, LayoutGrid } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/shared/lib/utils'

const navItems = [
    {
        label: '首页',
        icon: Home,
        to: '/m',
    },
    {
        label: '分类',
        icon: LayoutGrid,
        to: '/m/category',
    },
    {
        label: '设置',
        icon: Settings,
        to: '/m/settings',
    },
    {
        label: '我的',
        icon: User,
        to: '/m/profile',
    },
]

export function MobileBottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 pb-safe backdrop-blur-md">
            {navItems.map((item) => {
                const isActive = location.pathname === item.to
                const Icon = item.icon

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1 transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        <Icon className={cn('h-5 w-5', isActive && 'animate-in zoom-in-75 duration-300')} />
                        <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
