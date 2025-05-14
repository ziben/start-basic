import { useTranslation } from '~/hooks/useTranslation'

export default function AdminSession() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.session.title', { defaultMessage: '会话管理' })}</h1>
      <p>{t('admin.session.desc', { defaultMessage: '管理账号会话数据。' })}</p>
    </div>
  )
} 