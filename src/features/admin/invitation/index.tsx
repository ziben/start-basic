import { useTranslation } from '~/hooks/useTranslation'

export default function AdminInvitation() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.invitation.title')}</h1>
      <p>{t('admin.invitation.desc')}</p>
    </div>
  )
}
