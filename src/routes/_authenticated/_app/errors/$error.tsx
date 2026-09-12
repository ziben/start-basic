import { createFileRoute } from '@tanstack/react-router'
import {
  ForbiddenError,
  GeneralError,
  MaintenanceError,
  NotFoundError,
  UnauthorisedError,
} from '@/shared/components/errors'

export const Route = createFileRoute('/_authenticated/_app/errors/$error')({
  component: RouteComponent,
})

function RouteComponent() {
  const { error } = Route.useParams()

  const errorMap: Record<string, React.ComponentType> = {
    unauthorized: UnauthorisedError,
    forbidden: ForbiddenError,
    'not-found': NotFoundError,
    'internal-server-error': GeneralError,
    'maintenance-error': MaintenanceError,
  }
  const ErrorComponent = errorMap[error] || NotFoundError

  return (
    <div className='flex h-full flex-col'>
      <ErrorComponent />
    </div>
  )
}
