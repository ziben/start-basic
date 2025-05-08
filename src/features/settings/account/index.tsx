import ContentSection from '../components/content-section'
import { AccountForm } from './account-form'
import { useTranslation } from '~/hooks/useTranslation'

export default function SettingsAccount() {
  const { t } = useTranslation()
  
  return (
    <ContentSection
      title={t('settings.account.title')}
      desc={t('settings.account.desc')}
    >
      <AccountForm />
    </ContentSection>
  )
}
