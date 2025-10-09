import { useTranslation } from '~/hooks/useTranslation'

export default function AdminSession() {
  const { t } = useTranslation()
  return (
    <div>
  <h1>{t('admin.session.title')}</h1>
  <p>{t('admin.session.desc')}</p>
    </div>
  )
} 