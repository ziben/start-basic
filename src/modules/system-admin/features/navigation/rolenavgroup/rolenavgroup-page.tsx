import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

export default function AdminRoleNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.rolenavgroup.title')}</h1>
      <p>{t('admin.rolenavgroup.desc')}</p>
    </div>
  )
}





