import { createFileRoute } from '@tanstack/react-router'
import { DepartmentPage } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/department')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DepartmentPage />
}
