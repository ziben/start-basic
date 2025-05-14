import { useTranslation } from '~/hooks/useTranslation'

export default function AdminInvitation() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.invitation.title', { defaultMessage: '邀请管理' })}</h1>
      <p>{t('admin.invitation.desc', { defaultMessage: '管理成员邀请数据。' })}</p>
    </div>
  )
} 