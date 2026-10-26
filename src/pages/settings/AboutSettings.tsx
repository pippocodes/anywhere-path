import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'
import About from '../About'

function AboutSettings() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <SettingsSectionHeader title="About" />
      <About embedded />
    </div>
  )
}

export default AboutSettings
