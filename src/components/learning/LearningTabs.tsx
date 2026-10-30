import { NavLink } from 'react-router-dom'

/** Shared tab row linking Courses and Roadmap Builder — the two routes "My Learning" groups together. Each page keeps its own heading/route; this just makes them read as one area. */
function LearningTabs() {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      <NavLink
        to="/learning"
        end
        style={({ isActive }) => ({
          padding: '7px 16px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid var(--line)',
          background: isActive ? 'var(--gradient-primary)' : 'none',
          color: isActive ? 'var(--ink)' : 'var(--mute)',
        })}
      >
        Courses
      </NavLink>
      <NavLink
        to="/roadmap"
        style={({ isActive }) => ({
          padding: '7px 16px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid var(--line)',
          background: isActive ? 'var(--gradient-primary)' : 'none',
          color: isActive ? 'var(--ink)' : 'var(--mute)',
        })}
      >
        Roadmap Builder
      </NavLink>
    </div>
  )
}

export default LearningTabs
