import { createFileRoute } from '@tanstack/react-router'
import { HealthPersonsPage } from '~/modules/health/features/persons/health-persons-page'

export const Route = createFileRoute('/_authenticated/_app/health/persons')({
  component: HealthPersonsPage,
})
