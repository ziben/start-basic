import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function AppHeader() {
  return (
    <Header fixed>
      <Search />
      <div className='ms-auto flex items-center space-x-4'>
        <ThemeSwitch />
        <ConfigDrawer />
      </div>
    </Header>
  )
}
