import { motion } from 'framer-motion'

interface Props {
  onRetry: () => void
}

/**
 * Shown when the initial cloud fetch fails — deliberately loud and
 * impossible to miss, because the alternative (silently treating the
 * failure as "signed in with nothing") would look exactly like data loss
 * and, worse, could risk actually causing it (see AppContext.tsx).
 */
function CloudLoadErrorBanner({ onRetry }: Props) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '10px 20px',
        background: 'var(--ink-2)',
        borderBottom: '1px solid var(--rose)',
        fontSize: 13.5,
        color: 'var(--cream)',
        textAlign: 'center',
      }}
    >
      <span>Couldn't load your data from the cloud — nothing has been changed. Check your connection and try again.</span>
      <button
        type="button"
        onClick={onRetry}
        className="btn-outline"
        style={{ fontSize: 12.5, padding: '5px 14px', flexShrink: 0 }}
      >
        Retry
      </button>
    </motion.div>
  )
}

export default CloudLoadErrorBanner
