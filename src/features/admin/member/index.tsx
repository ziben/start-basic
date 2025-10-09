import { useTranslation } from '~/hooks/useTranslation'

export default function AdminMember() {
  const { t } = useTranslation()
  return (
    <div>
  <h1>{t('admin.member.title')}</h1>
  <p>{t('admin.member.desc')}</p>
    </div>
  )
} 