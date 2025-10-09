import { toast } from 'sonner'

// Handle server errors in a type-safe way without relying on axios runtime types
export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number((error as any).status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  // Narrow unknown to access response shape safely
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as any).response === 'object'
  ) {
    const resp = (error as any).response
    errMsg = resp?.data?.title ?? errMsg
  }

  toast.error(errMsg)
}
