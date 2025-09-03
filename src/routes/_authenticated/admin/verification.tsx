import { createFileRoute } from '@tanstack/react-router'
import AdminVerification from '~/features/admin/verification'

export const Route = createFileRoute('/_authenticated/admin/verification')({
  component: AdminVerification,
}) 