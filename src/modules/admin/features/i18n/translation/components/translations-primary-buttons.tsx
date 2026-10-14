import { Plus } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { useTranslations } from './translations-provider'

export function TranslationsPrimaryButtons() {
  const { setOpen } = useTranslations()
  const { t } = useTranslation()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>{t('common.buttons.create', { defaultMessage: 'Create' })}</span>
        <Plus size={18} />
      </Button>
    </div>
  )
}
