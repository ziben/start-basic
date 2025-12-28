import { useTranslation } from '~/hooks/useTranslation'

export default function AdminMemberCreate() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.member.create.title', { defaultMessage: '添加成员' })}</h1>
      <p>{t('admin.member.create.desc', { defaultMessage: '添加成员页面' })}</p>
    </div>
  )
}
