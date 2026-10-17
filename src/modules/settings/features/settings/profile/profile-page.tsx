import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile(): React.ReactElement {
  return (
    <ContentSection title='个人资料' desc='管理您的显示名称和头像，让账号资料保持最新。'>
      <ProfileForm />
    </ContentSection>
  )
}
