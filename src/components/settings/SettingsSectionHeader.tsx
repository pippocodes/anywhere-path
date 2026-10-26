import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
}

/** Back arrow + title shown atop every /settings/* section page — always returns to the /settings list. The phone/browser back button works independently via normal route history, no special handling needed here. */
function SettingsSectionHeader({ title }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
      <button
        type="button"
        onClick={() => navigate('/settings')}
        aria-label="Back to Settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'none',
          border: '1px solid var(--line)',
          color: 'var(--text)',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        ‹
      </button>
      <h1 className="page-title" style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 34px)' }}>
        {title}
      </h1>
    </div>
  )
}

export default SettingsSectionHeader
