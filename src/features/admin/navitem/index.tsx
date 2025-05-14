import { useTranslation } from '~/hooks/useTranslation'

export default function AdminNavItem() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('admin.navitem.title', { defaultMessage: '导航项管理' })}</h1>
      <p>{t('admin.navitem.desc', { defaultMessage: '管理侧边栏导航项数据。' })}</p>
    </div>
  )
} 