import { Download, Plus } from 'lucide-react'
import { useTranslation } from '~/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { useTranslations } from './translations-provider'

// import { useTranslations } from '~/hooks/useTranslationApi'

export function TranslationsPrimaryButtons() {
  const { setOpen } = useTranslations()
  const { t } = useTranslation()
  return (
    <div className='flex gap-2'>
      <Button variant='outline' className='space-x-1' onClick={() => setOpen('import')}>
        <span>{t('admin.translation.button.import')}</span>
        <Download size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>{t('common.buttons.create', { defaultMessage: 'Create' })}</span>
        <Plus size={18} />
      </Button>
    </div>
  )
}
