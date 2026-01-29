import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/category')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/m/category"!</div>
}
