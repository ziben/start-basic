import { useState } from 'react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { RoleNavGroupTable } from './components/role-navgroup-table'
import { RoleNavGroupDialogs } from './components/role-navgroup-dialogs'
import { RoleNavGroupPrimaryButtons } from './components/role-navgroup-primary-buttons'

export default function AdminRoleNavGroup() {
  const { t } = useTranslation()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleManage = (id: string) => {
    setSelectedRoleId(id)
    setIsDialogOpen(true)
  }

  return (
    <>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('admin.rolenavgroup.title')}
            </h2>
            <p className='text-muted-foreground'>
              {t('admin.rolenavgroup.desc')}
            </p>
          </div>
          <RoleNavGroupPrimaryButtons />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
          <RoleNavGroupTable onManage={handleManage} />
        </div>
      </AppHeaderMain>

      <RoleNavGroupDialogs
        roleId={selectedRoleId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
