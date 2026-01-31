import { Outlet } from '@tanstack/react-router'
import { Monitor, Bell, Palette, Wrench, UserCog } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarNav } from '@/modules/settings/features/settings/components/sidebar-nav'

const sidebarNavItems = [
    {
        title: 'Profile',
        href: '/admin/settings',
        icon: <UserCog size={18} />,
    },
    {
        title: 'Account',
        href: '/admin/settings/account',
        icon: <Wrench size={18} />,
    },
    {
        title: 'Appearance',
        href: '/admin/settings/appearance',
        icon: <Palette size={18} />,
    },
    {
        title: 'Notifications',
        href: '/admin/settings/notifications',
        icon: <Bell size={18} />,
    },
    {
        title: 'Display',
        href: '/admin/settings/display',
        icon: <Monitor size={18} />,
    },
]

export function AdminSettingsLayout(): React.ReactElement {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className='space-y-0.5'>
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>Settings</h1>
                <p className='text-muted-foreground'>Manage your account settings and set e-mail preferences.</p>
            </div>
            <Separator />
            <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <aside className='top-0 lg:sticky lg:w-1/5'>
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className='flex w-full overflow-y-hidden p-1'>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
