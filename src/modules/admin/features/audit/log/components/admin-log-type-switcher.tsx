import { cn } from '@/shared/lib/utils'
import { logTypes, type LogType } from '../data/schema'
import { useAdminLogContext } from './admin-log-provider'

export function AdminLogTypeSwitcher() {
  const { type, setType } = useAdminLogContext()

  return (
    <div className='flex rounded-md border bg-muted/40 p-0.5 gap-0.5'>
      {logTypes.map((item) => (
        <button
          key={item.value}
          type='button'
          onClick={() => setType(item.value as LogType)}
          className={cn(
            'rounded px-3 py-1 text-sm font-medium transition-all',
            type === item.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
