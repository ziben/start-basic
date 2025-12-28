import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

export default function AdminVerification() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.verification.title')}</h1>
      <p>{t('admin.verification.desc')}</p>
    </div>
  )
}




