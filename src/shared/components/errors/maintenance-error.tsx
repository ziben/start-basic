import { Button } from '@/components/ui/button'
import { useTranslation } from '@/modules/admin/shared/hooks/use-translation'

export function MaintenanceError(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        <span className='font-medium'>{t('errors.maintenance.title')}</span>
        <p className='text-center text-muted-foreground'>
          {t('errors.maintenance.desc.line1')} <br /> {t('errors.maintenance.desc.line2')}
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>{t('errors.actions.learnMore')}</Button>
        </div>
      </div>
    </div>
  )
}
