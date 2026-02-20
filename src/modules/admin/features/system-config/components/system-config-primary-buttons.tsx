import { Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRefreshSystemConfig } from '../hooks/use-system-config-query'
import { useSystemConfigContext } from './system-config-provider'

export function SystemConfigPrimaryButtons(): React.ReactElement {
  const refreshMutation = useRefreshSystemConfig()
  const { setOpen } = useSystemConfigContext()

  const handleRefresh = async (): Promise<void> => {
    try {
      const result = await refreshMutation.mutateAsync()
      toast.success(`缓存已刷新`, {
        description: `时间戳: ${new Date(result.refreshedAt).toLocaleString('zh-CN')}`,
      })
    } catch (error) {
      toast.error('刷新失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        onClick={handleRefresh}
        disabled={refreshMutation.isPending}
        variant='outline'
        className='gap-2'
      >
        <RefreshCcw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
        {refreshMutation.isPending ? '刷新中…' : '刷新缓存'}
      </Button>

      <Button onClick={() => setOpen('create')} className='gap-2'>
        <Plus className='h-4 w-4' />
        新增配置
      </Button>
    </div>
  )
}
