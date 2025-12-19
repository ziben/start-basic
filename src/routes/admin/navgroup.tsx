import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/navgroup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/navgroup"!</div>
}
