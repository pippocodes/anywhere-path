interface Props {
  onImport: () => void
  onSkip: () => void
}

/** One-time prompt shown right after a user's first login, if this device has local data their new account doesn't yet. */
function MigratePrompt({ onImport, onSkip }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="migrate-prompt-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(89,13,34,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 24,
      }}
    >
      <div className="card auth-card" style={{ maxWidth: 440, animationDuration: '0.35s' }}>
        <h3 id="migrate-prompt-title" style={{ fontSize: 19, marginBottom: 10 }}>
          Import your saved data?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--plum)', lineHeight: 1.6, marginBottom: 22 }}>
          We found roadmaps and habits saved on this device from before you signed in. Import them into your new
          account? This only happens once.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onImport}>
            Import My Data
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onSkip}>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  )
}

export default MigratePrompt
