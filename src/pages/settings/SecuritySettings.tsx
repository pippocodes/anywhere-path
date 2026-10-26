import SecurityCard from '../../components/settings/SecurityCard'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

function SecuritySettings() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Security" />
      <SecurityCard />
    </div>
  )
}

export default SecuritySettings
