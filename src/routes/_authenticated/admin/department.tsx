import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { DepartmentsPage } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/department')({
  validateSearch: tableSearchSchema,
  component: DepartmentsPage,
})

