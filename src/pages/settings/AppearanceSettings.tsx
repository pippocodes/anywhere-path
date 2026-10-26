import { useTheme, THEME_KEYS, THEME_CATALOGUE, type ColorMode } from '../../context/ThemeContext'
import Pills from '../../components/ui/Pills'
import ThemeCard from '../../components/settings/ThemeCard'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

const MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function AppearanceSettings() {
  const { theme, colorMode, resolvedMode, setTheme, setColorMode } = useTheme()

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Appearance" />
      <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 18 }}>
        Pick a theme and whether it should follow your system, or stay light or dark.
      </p>

      <div style={{ marginBottom: 20 }}>
        <div className="micro-label" style={{ marginBottom: 10 }}>
          Mode
        </div>
        <Pills options={MODE_OPTIONS} value={colorMode} onChange={(v) => setColorMode(v as ColorMode)} layoutId="settings-mode-pills" />
      </div>

      <div className="micro-label" style={{ marginBottom: 10 }}>
        Theme
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {THEME_KEYS.map((key) => (
          <ThemeCard
            key={key}
            themeKey={key}
            name={THEME_CATALOGUE[key].name}
            swatches={THEME_CATALOGUE[key].swatches}
            previewMode={resolvedMode}
            selected={theme === key}
            onSelect={() => setTheme(key)}
          />
        ))}
      </div>
    </div>
  )
}

export default AppearanceSettings
