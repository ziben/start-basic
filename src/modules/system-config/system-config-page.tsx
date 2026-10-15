import type { ReactElement } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ErrorBoundary } from '@/shared/components/error-boundary'
import { QueryState } from '@/shared/components/query-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { SystemConfigDialogs } from './components/system-config-dialogs'
import { SystemConfigPrimaryButtons } from './components/system-config-primary-buttons'
import { SystemConfigProvider } from './components/system-config-provider'
import { SystemConfigTable } from './components/system-config-table'
import { useSystemConfigs } from './hooks/use-system-config-query'

const route = getRouteApi('/_authenticated/admin/system-config')

export default function AdminSystemConfigPage(): ReactElement {
  const { data: configs = [], isLoading, error, refetch, isRefetching } = useSystemConfigs()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <SystemConfigProvider>
      <AppHeaderMain fixed>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>系统配置</h2>
            <p className='text-muted-foreground'>运行时配置管理、手动刷新和变更审计</p>
          </div>
          <SystemConfigPrimaryButtons />
        </div>

        <div className='-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1'>
          <ErrorBoundary fallbackMessage='配置表格渲染失败'>
            <SystemConfigTable
              data={configs}
              isLoading={isLoading}
              errorState={
                error ? (
                  <QueryState error={error} onRetry={() => void refetch()} isRetrying={isRefetching} />
                ) : undefined
              }
              onReload={() => void refetch()}
              isReloading={isRefetching}
              search={search}
              navigate={navigate}
            />
          </ErrorBoundary>
        </div>
      </AppHeaderMain>

      <SystemConfigDialogs />
    </SystemConfigProvider>
  )
}
