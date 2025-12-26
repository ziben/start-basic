import { useAdminLogContext } from './admin-log-provider'

export function AdminLogTypeSwitcher() {
  const { type, setType } = useAdminLogContext()

  return (
    <div className='flex rounded-md border'>
      <button
        className={`px-3 py-1 text-sm ${type === 'system' ? 'bg-muted' : ''}`}
        onClick={() => setType('system')}
      >
        系统日志
      </button>
      <button
        className={`px-3 py-1 text-sm ${type === 'audit' ? 'bg-muted' : ''}`}
        onClick={() => setType('audit')}
      >
        操作日志
      </button>
    </div>
  )
}
