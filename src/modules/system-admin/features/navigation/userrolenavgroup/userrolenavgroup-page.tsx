import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

export default function AdminUserRoleNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.userrolenavgroup.title')}</h1>
      <p>{t('admin.userrolenavgroup.desc')}</p>
    </div>
  )
}





