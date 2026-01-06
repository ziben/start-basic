import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { DepartmentsPage } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/department')({
  validateSearch: tableSearchSchema,
  component: DepartmentsPage,
})
