import { useTranslation } from '~/hooks/useTranslation'

export default function AdminOrganization() {
  const { t } = useTranslation()
  return (
    <div>
  <h1>{t('admin.organization.title')}</h1>
  <p>{t('admin.organization.desc')}</p>
    </div>
  )
} 