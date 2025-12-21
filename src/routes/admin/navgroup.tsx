import { createFileRoute } from '@tanstack/react-router'
import { AdminNavGroups } from '~/features/admin/navgroup'

export const Route = createFileRoute('/admin/navgroup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminNavGroups />
}
