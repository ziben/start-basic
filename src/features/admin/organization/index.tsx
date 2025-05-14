import { useTranslation } from '~/hooks/useTranslation'

export default function AdminOrganization() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.organization.title', { defaultMessage: '组织管理' })}</h1>
      <p>{t('admin.organization.desc', { defaultMessage: '管理组织相关数据。' })}</p>
    </div>
  )
} 