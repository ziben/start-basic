import React from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ChevronRight, Home } from 'lucide-react'
import { useTranslation } from '~/hooks/useTranslation'
import AdminNavItemTable from './components/admin-navitem-table'
import AdminNavItemPrimaryButtons from './components/admin-navitem-primary-buttons'
import AdminNavItemDialogs from './components/admin-navitem-dialogs'
import AdminNavItemProvider from './context/admin-navitem-context'
import { useNavitems } from '~/hooks/useNavitemApi'
import { useNavgroup } from '~/hooks/useNavgroupApi'
import { Toaster } from '~/components/ui/sonner'
import { Route as NavItemRoute } from '~/routes/_authenticated/admin/navitem'
import { Link } from '@tanstack/react-router'

export default function AdminNavItemPage() {
  const { t } = useTranslation();
  const { navGroupId } = NavItemRoute.useSearch()
  
  // 获取导航组信息（如果有导航组ID）
  const { data: navGroup } = useNavgroup(navGroupId);
  
  // 使用API hooks获取数据 - 无论是否有navGroupId都加载所有导航项
  // 这里移除了enabled条件，确保页面加载时始终加载数据
  const { data: navItemList = [], isLoading, error } = useNavitems(navGroupId)

  return (
    <AdminNavItemProvider initialNavGroupId={navGroupId}>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        {/* 导航路径 */}
        {navGroupId && (
          <div className="mb-4 flex items-center text-sm text-muted-foreground">
            <Link to="/admin/navgroup" className="hover:text-primary">
              <Home className="mr-1 h-4 w-4 inline" />
              {t('admin.navitem.breadcrumb.navgroups', { defaultMessage: '导航组管理' })}
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="font-medium text-foreground">
              {navGroup?.title ?? t('admin.navitem.breadcrumb.loading', { defaultMessage: '加载中...' })}
            </span>
          </div>
        )}
        
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {navGroupId && navGroup 
                ? t('admin.navitem.titleForGroup', { title: t(navGroup.title) })
                : t('admin.navitem.title')}
            </h2>
            <p className='text-muted-foreground'>
              {navGroupId
                ? t('admin.navitem.descForGroup')
                : t('admin.navitem.desc', { defaultMessage: '管理所有导航项数据。' })}
            </p>
          </div>
          <AdminNavItemPrimaryButtons navGroupId={navGroupId} />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminNavItemTable 
            data={navItemList} 
            isLoading={isLoading} 
            error={error} 
            navGroupId={navGroupId}
          />
        </div>
      </Main>
      <AdminNavItemDialogs />
      <Toaster />
    </AdminNavItemProvider>
  );
}