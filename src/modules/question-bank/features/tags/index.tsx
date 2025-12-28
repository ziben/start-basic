import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { TagsTable } from './components/tags-table'

export function TagsPage() {
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
            <h2 className='text-2xl font-bold tracking-tight'>标签管理</h2>
            <p className='text-muted-foreground'>管理题库中的所有标签，用于快速筛选和分类题目</p>
          </div>
        </div>
        <div className='flex-1 overflow-auto py-4'>
          <TagsTable />
        </div>
      </Main>
    </>
  )
}

export default TagsPage
