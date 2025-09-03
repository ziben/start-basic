import { createFileRoute } from '@tanstack/react-router'
import AdminOrganization from '~/features/admin/organization'

export const Route = createFileRoute('/_authenticated/admin/organization')({
  component: AdminOrganization,
}) 