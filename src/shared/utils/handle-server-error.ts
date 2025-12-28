import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    typeof (error as any).name === 'string' &&
    (error as any).name === 'AbortError'
  ) {
    return
  }

  console.log(error)

  let errMsg = 'Something went wrong!'

  if (error && typeof error === 'object' && 'status' in error && Number((error as any).status) === 204) {
    errMsg = 'Content not found.'
  }

  if (error && typeof error === 'object' && 'response' in error && typeof (error as any).response === 'object') {
    const resp = (error as any).response
    errMsg = resp?.data?.title ?? errMsg
  }

  toast.error(errMsg)
}
