import { createFileRoute } from '@tanstack/react-router'
import { ModuleDiagnosticsPage } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/modules')({
  component: ModuleDiagnosticsPage,
})
