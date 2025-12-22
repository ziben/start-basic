import { createFileRoute } from '@tanstack/react-router'
import AdminNavItem from '~/features/admin/navitem'

export const Route = createFileRoute('/admin/navitem')({
  component: AdminNavItem,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      navGroupId: search.navGroupId as string | undefined,
    }
  },
})
