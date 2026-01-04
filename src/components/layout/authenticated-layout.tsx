import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/shared/lib/cookies'
import { cn } from '@/shared/lib/utils'
import { LayoutProvider } from '@/shared/context/layout-provider'
import { SearchProvider } from '@/shared/context/search-provider'
import { TabProvider } from '@/shared/context/tab-context'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TabBar } from '@/components/layout/tab-bar'
import { TabContent } from '@/components/layout/tab-content'
import { SkipToMain } from '@/components/skip-to-main'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <TabProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <SkipToMain />
            <AppSidebar />
            <SidebarInset
              className={cn(
                // Set content container, so we can use container queries
                '@container/content',

                // If layout is fixed, set the height
                // to 100svh to prevent overflow
                'has-data-[layout=fixed]:h-svh',

                // If layout is fixed and sidebar is inset,
                // set the height to 100svh - spacing (total margins) to prevent overflow
                'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]',

                // Flex layout for tab system
                'flex flex-col'
              )}
            >
              <TabBar />
              <div className="flex-1 overflow-auto">
                <TabContent />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TabProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}




