import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/shared/lib/cookies'
import { cn } from '@/shared/lib/utils'
import { LayoutProvider } from '@/shared/context/layout-provider'
import { SearchProvider } from '@/shared/context/search-provider'
import { TabProvider } from '@/shared/context/tab-context'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { TabBar } from '@/components/layout/tab-bar'
import { TabContent } from '@/components/layout/tab-content'
import { SkipToMain } from '@/components/skip-to-main'
import { AdminHeader } from '~/modules/system-admin/components/admin-header'

type AdminLayoutProps = {
  children?: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <TabProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <SkipToMain />
            <AdminSidebar />
            <SidebarInset
              className={cn(
                // Set content container, so we can use container queries
                '@container/content',

                // Subtract margins (m-2 = 0.5rem * 2 = 1rem) to show bottom border-radius
                'h-[calc(100svh-1rem)] overflow-hidden',

                // Flex layout for tab system
                'flex flex-col'
              )}
            >
              <AdminHeader />
              <TabBar />
              <div className="flex-1 overflow-hidden">
                <TabContent />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TabProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}





