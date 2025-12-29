import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/navitem')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      navGroupId: search.navGroupId as string | undefined,
    }
  },
  beforeLoad: async ({ search }) => {
    throw redirect({
      to: '/admin/navigation',
      search: {
        tab: 'items',
        navGroupId: search.navGroupId ?? undefined,
        filter: undefined,
        title: undefined,
        description: undefined,
        page: undefined,
        pageSize: undefined,
      },
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return null
}

