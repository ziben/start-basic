import { Navigate, createFileRoute } from '@tanstack/react-router'
import { HomepageMobile } from '~/modules/dashboard/components/homepage-mobile'
import { HomepagePC } from '~/modules/dashboard/components/homepage-pc'
import { useIsMobile } from '~/shared/hooks/use-mobile'
import { env } from '~/shared/lib/env'

export const Route = createFileRoute('/(public)/')({
  component: HomePage,
})

function HomePage() {
  const isMobile = useIsMobile()

  // Configuration routes
  const pcHomeRoute = env.VITE_PC_HOMEPAGE_ROUTE
  const mobileHomeRoute = env.VITE_MOBILE_HOMEPAGE_ROUTE

  // Handle redirection if configured to something other than the root
  if (isMobile === true && mobileHomeRoute !== '/') {
    return <Navigate to={mobileHomeRoute} replace />
  }

  if (isMobile === false && pcHomeRoute !== '/') {
    return <Navigate to={pcHomeRoute} replace />
  }

  // Handle component rendering based on device if still at root
  return isMobile ? <HomepageMobile /> : <HomepagePC />
}

