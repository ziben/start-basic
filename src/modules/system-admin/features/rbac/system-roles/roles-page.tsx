import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { AppHeaderMain } from '@/components/layout/app-header-main'
import { RolesProvider } from './context/roles-context'
import { RolesTable } from './components/roles-table'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesDialogs } from './components/roles-dialogs'

export default function RolesPage() {
  const { t } = useTranslation()
  return (
    <RolesProvider>
      <AppHeaderMain>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('admin.role.title')}</h2>
            <p className="text-muted-foreground">{t('admin.role.desc')}</p>
          </div>
          <RolesPrimaryButtons />
        </div>
        <RolesTable />
        <RolesDialogs />
      </AppHeaderMain>
    </RolesProvider>
  )
}
