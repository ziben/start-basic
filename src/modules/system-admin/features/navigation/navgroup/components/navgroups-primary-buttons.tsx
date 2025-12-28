import { Download, Plus } from 'lucide-react'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { useNavGroups } from './navgroups-provider'

export function NavGroupsPrimaryButtons() {
  const { setOpen } = useNavGroups()
  const { t } = useTranslation()
  return (
    <div className='flex gap-2'>
      <Button variant='outline' className='space-x-1' onClick={() => setOpen('import')}>
        <span>{t('common.buttons.import')}</span>
        <Download size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>{t('common.buttons.create')}</span>
        <Plus size={18} />
      </Button>
    </div>
  )
}




