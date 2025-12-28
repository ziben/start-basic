import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

export default function AdminMemberDetail() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.member.detail.title', { defaultMessage: '成员详情' })}</h1>
      <p>{t('admin.member.detail.desc', { defaultMessage: '成员详情页面' })}</p>
    </div>
  )
}




