import ProfileCard from '../../components/settings/ProfileCard'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

function ProfileSettings() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Profile" />
      <ProfileCard />
    </div>
  )
}

export default ProfileSettings
