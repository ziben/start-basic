import React from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { useAdminNavItemContext } from '../context/admin-navitem-context'

interface Props {
  navGroupId?: string
}

const AdminNavItemPrimaryButtons: React.FC<Props> = ({ navGroupId }) => {
  const { t } = useTranslation()
  const { setCreateDialogOpen, setSelectedNavItem } = useAdminNavItemContext()

  return (
    <div className='flex items-center space-x-2'>
      <Button
        onClick={() => {
          // ensure no selected item remains when creating a new navitem
          setSelectedNavItem(null)
          setCreateDialogOpen(true)
        }}
      >
        <Plus className='mr-2 h-4 w-4' />
        {navGroupId ? t('admin.navitem.buttons.createInGroup') : t('admin.navitem.buttons.create')}
      </Button>
    </div>
  )
}

export default AdminNavItemPrimaryButtons





