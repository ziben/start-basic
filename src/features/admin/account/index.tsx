import { useTranslation } from '~/hooks/useTranslation'

export default function AdminAccount() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.account.title', { defaultMessage: '账号管理' })}</h1>
      <p>{t('admin.account.desc', { defaultMessage: '管理账号相关数据。' })}</p>
    </div>
  )
} 