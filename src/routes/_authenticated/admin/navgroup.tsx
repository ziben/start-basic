import { createFileRoute } from '@tanstack/react-router'
import AdminNavGroup from '~/features/admin/navgroup'

export const Route = createFileRoute('/_authenticated/admin/navgroup')({
  component: AdminNavGroup,
}) 