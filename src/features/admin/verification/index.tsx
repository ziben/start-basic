import { useTranslation } from '~/hooks/useTranslation'

export default function AdminVerification() {
  const { t } = useTranslation()
  return (
    <div>
  <h1>{t('admin.verification.title')}</h1>
  <p>{t('admin.verification.desc')}</p>
    </div>
  )
} 