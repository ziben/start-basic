import type { ReactNode } from 'react'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  isLoading?: boolean
  error?: unknown
  onRetry: () => void
  isRetrying?: boolean
  children?: ReactNode
}

export function QueryState({ isLoading, error, onRetry, isRetrying, children }: Props) {
  if (error) {
    return (
      <div role='alert' className='flex flex-col items-center gap-3 px-4 py-8 text-center'>
        <p className='text-sm text-destructive'>加载失败：{getErrorMessage(error)}</p>
        <Button variant='outline' size='sm' onClick={onRetry} disabled={isRetrying}>
          {isRetrying && <Loader2 className='mr-2 size-4 animate-spin' aria-hidden='true' />}
          重试
        </Button>
      </div>
    )
  }
  if (isLoading) {
    return (
      <div role='status' className='flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' aria-hidden='true' />
        加载中…
      </div>
    )
  }
  return children
}
