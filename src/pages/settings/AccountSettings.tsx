import AccountCard from '../../components/settings/AccountCard'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

function AccountSettings() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Account" />
      <AccountCard />
    </div>
  )
}

export default AccountSettings
