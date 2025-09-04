import { createFileRoute } from '@tanstack/react-router'
import { AdminNavGroups } from '~/features/admin/navgroup'

export const Route = createFileRoute('/_authenticated/admin/navgroup')({
  component: AdminNavGroups,
}) 