import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

export function AdminOrganizationCreate() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.organization.create.title', { defaultMessage: '创建组织' })}</h1>
      <p>{t('admin.organization.create.desc', { defaultMessage: '创建组织页面' })}</p>
    </div>
  )
}





