import { useTranslation } from '~/hooks/useTranslation'

export default function AdminNavGroup() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.navgroup.title', { defaultMessage: '分组管理' })}</h1>
      <p>{t('admin.navgroup.desc', { defaultMessage: '管理侧边栏分组数据。' })}</p>
    </div>
  )
} 