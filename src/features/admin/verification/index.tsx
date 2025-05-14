import { useTranslation } from '~/hooks/useTranslation'

export default function AdminVerification() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.verification.title', { defaultMessage: '验证管理' })}</h1>
      <p>{t('admin.verification.desc', { defaultMessage: '管理成员验证数据。' })}</p>
    </div>
  )
} 