import { Plus } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { useRolesContext } from '../context/roles-context'

export function RolesPrimaryButtons() {
  const { t } = useTranslation()
  const { openCreateDialog } = useRolesContext()

  return (
    <Button onClick={openCreateDialog}>
      <Plus className="mr-2 h-4 w-4" />
      {t('admin.role.button.create')}
    </Button>
  )
}
