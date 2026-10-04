import { Plus } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { useOrganizations } from './organizations-provider'

export function OrganizationsPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useOrganizations()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>{t('admin.organization.button.create')}</span> <Plus size={18} />
    </Button>
  )
}
