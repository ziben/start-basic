import { useTranslation } from '~/hooks/useTranslation'

export default function AdminUserRoleNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.userrolenavgroup.title', { defaultMessage: '用户角色分组管理' })}</h1>
      <p>{t('admin.userrolenavgroup.desc', { defaultMessage: '管理用户与角色分组的关联。' })}</p>
    </div>
  )
} 