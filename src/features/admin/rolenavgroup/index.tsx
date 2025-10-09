import { useTranslation } from '~/hooks/useTranslation'

export default function AdminRoleNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
  <h1>{t('admin.rolenavgroup.title')}</h1>
  <p>{t('admin.rolenavgroup.desc')}</p>
    </div>
  )
} 