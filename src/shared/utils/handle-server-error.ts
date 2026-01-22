import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  const err = error as Record<string, unknown> | null

  if (
    err &&
    typeof err === 'object' &&
    typeof err.name === 'string' &&
    err.name === 'AbortError'
  ) {
    return
  }

  console.log(error)

  let errMsg = 'Something went wrong!'

  if (err && typeof err.status === 'number' && err.status === 204) {
    errMsg = 'Content not found.'
  }

  if (err && typeof err.response === 'object' && err.response) {
    const resp = err.response as Record<string, unknown>
    const data = resp.data as Record<string, unknown> | undefined
    if (data && typeof data.title === 'string') {
      errMsg = data.title
    }
  }

  toast.error(errMsg)
}
