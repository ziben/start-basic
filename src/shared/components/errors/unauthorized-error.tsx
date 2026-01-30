import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/modules/admin/shared/hooks/use-translation'

export function UnauthorisedError(): React.ReactElement {
  const navigate = useNavigate()
  const { history } = useRouter()
  const { t } = useTranslation()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>{t('errors.unauthorized.title')}</span>
        <p className='text-center text-muted-foreground'>
          {t('errors.unauthorized.desc.line1')} <br /> {t('errors.unauthorized.desc.line2')}
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            {t('errors.actions.back')}
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>{t('errors.actions.home')}</Button>
        </div>
      </div>
    </div>
  )
}
