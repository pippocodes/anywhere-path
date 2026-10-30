import { useMemo } from 'react'
import { useApp } from '../../hooks/useApp'
import { useAuth } from '../../context/AuthContext'
import { useSharedItems } from '../../hooks/useSharedItems'
import { toDateStr, homeGreetingLine } from '../../utils/habits'
import { findNextUpItem } from '../../utils/nextUp'
import RevealHeading from '../ui/RevealHeading'
import TrailHero from './TrailHero'
import NextUpCard from './NextUpCard'
import TodayHabitsList from './TodayHabitsList'
import FriendsStrip from './FriendsStrip'

/** Signed-in Home: a warm greeting, the last-7-days trail, what's next, today's habits, and shared trackers — all from data already loaded, no AI anywhere on this screen. */
function TodayHome() {
  const { username } = useAuth()
  const { data, setHabitMark } = useApp()
  const { items: sharedItems } = useSharedItems()
  const today = toDateStr(new Date())

  const greetingLine = useMemo(() => homeGreetingLine(data.habits), [data.habits])
  const nextUp = useMemo(() => findNextUpItem(data), [data])
  const dateLabel = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), [])
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <RevealHeading as="h1" className="page-title">
        {username ? `${timeGreeting}, ${username}` : timeGreeting}
      </RevealHeading>
      <p style={{ fontSize: 14, color: 'var(--mute)', marginBottom: 2 }}>{dateLabel}</p>
      <p style={{ fontSize: 14.5, color: 'var(--cream)', marginBottom: 44 }}>{greetingLine}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <TrailHero habits={data.habits} />
        <NextUpCard item={nextUp} />
        <TodayHabitsList habits={data.habits} today={today} onMark={(habitId, mark) => setHabitMark(habitId, today, mark)} />
        <FriendsStrip items={sharedItems} today={today} />
      </div>
    </div>
  )
}

export default TodayHome
