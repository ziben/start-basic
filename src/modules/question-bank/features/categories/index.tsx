import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { CategoryTree } from './components/category-tree'

export function CategoriesPage() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>分类管理</h2>
            <p className='text-muted-foreground'>管理题库的分类层级</p>
          </div>
        </div>
        <div className='flex-1 overflow-auto py-4'>
          <CategoryTree />
        </div>
      </Main>
    </>
  )
}

export default CategoriesPage
