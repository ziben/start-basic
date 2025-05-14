import { useTranslation } from '~/hooks/useTranslation'

export default function AdminRoleNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.rolenavgroup.title', { defaultMessage: '角色分组管理' })}</h1>
      <p>{t('admin.rolenavgroup.desc', { defaultMessage: '管理角色与分组的关联。' })}</p>
    </div>
  )
} 