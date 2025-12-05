import { createFileRoute } from '@tanstack/react-router'
import { MaintenanceError } from '@/features/demo/errors/maintenance-error'

export const Route = createFileRoute('/(errors)/503')({
  component: MaintenanceError,
})
