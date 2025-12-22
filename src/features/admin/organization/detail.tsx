import { useTranslation } from '~/hooks/useTranslation'

export default function AdminOrganizationDetail() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.organization.detail.title', { defaultMessage: '组织详情' })}</h1>
      <p>{t('admin.organization.detail.desc', { defaultMessage: '组织详情页面' })}</p>
    </div>
  )
}
