import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/navgroup')({
  beforeLoad: async () => {
    throw redirect({
      to: '/admin/navigation',
      search: {
        tab: 'groups',
        navGroupId: undefined,
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
