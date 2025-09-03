import { createFileRoute } from '@tanstack/react-router'
import AdminSession from '~/features/admin/session'

export const Route = createFileRoute('/_authenticated/admin/session')({
  component: AdminSession,
}) 