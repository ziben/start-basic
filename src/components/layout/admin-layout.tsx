import { getCookie } from '@/shared/lib/cookies'
import { cn } from '@/shared/lib/utils'
import { LayoutProvider } from '@/shared/context/layout-provider'
import { SearchProvider } from '@/shared/context/search-provider'
import { SeoConfigProvider } from '@/shared/context/seo-config-context'
import { env } from '@/shared/lib/env'
import { TabProvider } from '@/shared/context/tab-context'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { TabBar } from '@/components/layout/tab-bar'
import { TabContent } from '@/components/layout/tab-content'
import { SkipToMain } from '@/components/skip-to-main'
import { AppHeader } from '@/components/layout/app-header'

export function AdminLayout(): React.ReactElement {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SeoConfigProvider
      config={{
        appName: env.VITE_ADMIN_APP_NAME ?? env.VITE_APP_NAME ?? 'Zi Start',
        appDesc: env.VITE_ADMIN_APP_DESC ?? env.VITE_APP_DESC ?? 'Zi Start.',
        titleTemplate: '{{pageTitle}} | {{appName}}',
        descriptionTemplate: '{{pageDesc}} · {{appName}}',
      }}
    >
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
                <AppHeader />
                <TabBar />
                <div className="flex-1 overflow-hidden">
                  <TabContent />
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TabProvider>
        </LayoutProvider>
      </SearchProvider>
    </SeoConfigProvider>
  )
}





