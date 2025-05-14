import { useTranslation } from '~/hooks/useTranslation'

export default function AdminMember() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.member.title', { defaultMessage: '成员管理' })}</h1>
      <p>{t('admin.member.desc', { defaultMessage: '管理组织成员数据。' })}</p>
    </div>
  )
} 