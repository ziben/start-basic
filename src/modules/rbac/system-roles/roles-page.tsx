import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { AppHeaderMain } from '@/components/layout/app-header-main'
import { RolesProvider } from './context/roles-context'
import { RolesTable } from './components/roles-table'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesDialogs } from './components/roles-dialogs'
import { ErrorBoundary } from '@/shared/components/error-boundary'

export default function RolesPage() {
  const { t } = useTranslation()
  return (
    <RolesProvider>
      <AppHeaderMain fixed>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('admin.role.title')}</h2>
            <p className="text-muted-foreground">{t('admin.role.desc')}</p>
          </div>
          <RolesPrimaryButtons />
        </div>
        <div className='-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1'>
          <ErrorBoundary fallbackMessage="角色表格渲染失败">
            <RolesTable />
          </ErrorBoundary>
        </div>
        <RolesDialogs />
      </AppHeaderMain>
    </RolesProvider>
  )
}
