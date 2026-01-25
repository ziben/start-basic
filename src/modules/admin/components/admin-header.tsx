import { useRouteContext } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AdminProfileDropdown } from './admin-profile-dropdown'

export function AdminHeader() {
  const { user } = useRouteContext({ from: '__root__' })

  const userData = {
    name: user?.name || 'Admin',
    email: user?.email || '',
    avatar: user?.image || '/avatars/admin.jpg',
  }

  return (
    <Header fixed>
      <Search />
      <div className='ms-auto flex items-center space-x-4'>
        <ThemeSwitch />
        <ConfigDrawer />
        <AdminProfileDropdown user={userData} />
      </div>
    </Header>
  )
}
