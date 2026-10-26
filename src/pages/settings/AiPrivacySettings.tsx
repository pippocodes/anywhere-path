import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

function AiPrivacySettings() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="AI & Privacy" />
      <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>"Generate with AI" (Roadmap Builder)</h3>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>
            Sends only the topic or goal you type to Anthropic's Claude API to generate an outline. Nothing else
            about your account is sent.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>AI habit insights (Habit Tracker)</h3>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>
            Sends aggregated numbers computed from your own habit data — completion rates, streaks, categories —
            to Claude to generate a short insight. Never your raw notes, friends, or anyone else's data.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>No other AI features</h3>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>
            These are the only two places in Anywhere Path that call an AI model. Everything else — course
            progress, roadmap schedules, and friends — runs entirely on data you can see and control in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AiPrivacySettings
