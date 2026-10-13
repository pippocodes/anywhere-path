import { memo } from 'react'
import type { OutlineNode } from '../types'
import { computeNodeMinutes, formatDurationShort, formatHours } from '../utils/outlineParser'
import { computeNodeDateRange, formatDateLabel, type ScheduledItem } from '../utils/scheduler'

interface Props {
  node: OutlineNode
  scheduleIndex?: Map<string, ScheduledItem> | null
}

// One accent color per level (0=topic ... 3=sub-module), reusing the
// existing palette so a nested outline reads as depth, not new colors.
const LEVEL_COLOR = ['var(--ink)', 'var(--plum)', 'var(--rose)', 'var(--cherry)']
const LEVEL_SIZE = [16, 14.5, 13.5, 13]

// Recursive, so it's memoized: toggling or editing text should only ever
// re-render the branch whose minutes actually changed, not the whole tree.
function OutlineNodeView({ node, scheduleIndex }: Props) {
  const isLeaf = node.children.length === 0
  const minutes = computeNodeMinutes(node)
  const range = scheduleIndex ? computeNodeDateRange(node, scheduleIndex) : null
  const rangeLabel =
    range?.startDate && range.endDate
      ? range.startDate === range.endDate
        ? formatDateLabel(range.startDate)
        : `${formatDateLabel(range.startDate)} – ${formatDateLabel(range.endDate)}`
      : null

  return (
    <div style={{ marginLeft: node.level === 0 ? 0 : 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          padding: '6px 0',
          borderLeft: node.level > 0 ? '2px solid var(--pink-pale)' : 'none',
          paddingLeft: node.level > 0 ? 12 : 0,
        }}
      >
        <span
          style={{
            fontFamily: node.level === 0 ? "'Poppins', sans-serif" : 'inherit',
            fontWeight: node.level === 0 ? 700 : 600,
            fontSize: LEVEL_SIZE[node.level],
            color: LEVEL_COLOR[node.level],
          }}
        >
          {node.name}
        </span>
        {node.duration && isLeaf && (
          <span className="outline-badge">{formatDurationShort(node.duration)}</span>
        )}
        {!isLeaf && (
          <span style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>{formatHours(minutes)} total</span>
        )}
        {rangeLabel && <span style={{ fontSize: 11.5, color: 'var(--plum)' }}>{rangeLabel}</span>}
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <OutlineNodeView key={child.id} node={child} scheduleIndex={scheduleIndex} />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(OutlineNodeView)
