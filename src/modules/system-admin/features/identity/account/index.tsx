import { useTranslation } from '~/hooks/useTranslation'

export default function AdminAccount() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.account.title')}</h1>
      <p>{t('admin.account.desc')}</p>
    </div>
  )
}
