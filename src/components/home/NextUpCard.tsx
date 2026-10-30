import { Link } from 'react-router-dom'
import { formatDuration } from '../../utils/duration'
import type { NextUpItem } from '../../utils/nextUp'

interface Props {
  item: NextUpItem | null
}

const KIND_LABEL: Record<NextUpItem['kind'], string> = {
  courseTopic: 'Next lecture',
  planStep: 'Next step',
}

/** The biggest card on Home — the single nearest scheduled lecture or plan step, with a gold Start button (the one gold action on this screen). Falls back to a "Start a roadmap" prompt when nothing anywhere is scheduled. */
function NextUpCard({ item }: Props) {
  if (!item) {
    return (
      <div className="card" style={{ padding: '36px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--cream)', marginBottom: 20 }}>Nothing scheduled yet.</p>
        <Link to="/roadmap" className="btn">
          Start a roadmap
        </Link>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '32px 32px' }}>
      <div className="micro-label" style={{ color: 'var(--mute)', marginBottom: 10 }}>
        {KIND_LABEL[item.kind]}
      </div>
      <h2 style={{ fontSize: 24, marginBottom: 8, color: 'var(--cream)' }}>{item.title}</h2>
      <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 24 }}>{formatDuration(item.seconds)}</p>
      <Link to={item.href} className="btn">
        Start
      </Link>
    </div>
  )
}

export default NextUpCard
