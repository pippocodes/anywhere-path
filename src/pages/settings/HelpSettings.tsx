import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'
import Help from '../Help'

function HelpSettings() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <SettingsSectionHeader title="Help" />
      <Help embedded />
    </div>
  )
}

export default HelpSettings
