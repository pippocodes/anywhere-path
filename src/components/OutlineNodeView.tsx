import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DurationUnit, OutlineNode } from '../types'
import { computeNodeMinutes, formatDurationShort, formatHours } from '../utils/outlineParser'
import { computeNodeDateRange, formatDateLabel, type ScheduledItem } from '../utils/scheduler'
import { useOutlineEditor } from '../context/OutlineEditorContext'
import AnimatedCheckbox from './motion/AnimatedCheckbox'

interface Props {
  node: OutlineNode
  scheduleIndex?: Map<string, ScheduledItem> | null
  // Read-only checkable mode (the saved-roadmap view) — mutually exclusive
  // with the drag/rename/delete editor affordances above, which only
  // appear inside an OutlineEditorContext.Provider.
  checkable?: boolean
  completedIds?: Set<string>
  onToggleComplete?: (id: string) => void
}

// One accent color per level (0=topic ... 3=sub-module), reusing the
// existing palette so a nested outline reads as depth, not new colors.
const LEVEL_COLOR = ['var(--cream)', 'var(--cream)', 'var(--mute)', 'var(--gold)']
const LEVEL_SIZE = [16, 14.5, 13.5, 13]
const DURATION_UNITS: DurationUnit[] = ['m', 'h', 'd', 'w']

// Recursive, so it's memoized: toggling or editing text should only ever
// re-render the branch whose minutes actually changed, not the whole tree.
function OutlineNodeView({ node, scheduleIndex, checkable, completedIds, onToggleComplete }: Props) {
  const editor = useOutlineEditor()
  const isLeaf = node.children.length === 0
  const isDone = !!(checkable && isLeaf && completedIds?.has(node.id))
  const minutes = computeNodeMinutes(node)
  const range = scheduleIndex ? computeNodeDateRange(node, scheduleIndex) : null
  const rangeLabel =
    range?.startDate && range.endDate
      ? range.startDate === range.endDate
        ? formatDateLabel(range.startDate)
        : `${formatDateLabel(range.startDate)} – ${formatDateLabel(range.endDate)}`
      : null

  // Always called (hooks can't be conditional) — inert when there's no
  // ancestor DndContext, which only matters if this component is ever
  // reused somewhere that doesn't provide one.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })

  const isEditingName = editor?.editingNameId === node.id
  const isEditingDuration = editor?.editingDurationId === node.id
  const isPendingDelete = editor?.pendingDeleteId === node.id

  return (
    <div
      ref={editor ? setNodeRef : undefined}
      style={{
        marginLeft: node.level === 0 ? 0 : 18,
        transform: editor ? CSS.Transform.toString(transform) : undefined,
        transition: editor ? transition : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          borderLeft: node.level > 0 ? '2px solid var(--line)' : 'none',
          paddingLeft: node.level > 0 ? 14 : 0,
        }}
      >
        {checkable && isLeaf && (
          <AnimatedCheckbox
            checked={isDone}
            onChange={() => onToggleComplete?.(node.id)}
            ariaLabel={`Mark "${node.name}" ${isDone ? 'not done' : 'done'}`}
          />
        )}
        {editor && (
          <span
            {...attributes}
            {...listeners}
            title="Drag to reorder"
            style={{ cursor: 'grab', color: 'var(--line)', fontSize: 14, touchAction: 'none' }}
          >
            ⠿
          </span>
        )}

        {isEditingName ? (
          <input
            autoFocus
            value={editor!.nameDraft}
            onChange={(e) => editor!.changeNameDraft(e.target.value)}
            onBlur={() => editor!.commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') editor!.commitRename()
              if (e.key === 'Escape') editor!.cancelRename()
            }}
            style={{
              fontSize: LEVEL_SIZE[node.level],
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 6,
              border: '1px solid var(--gold)',
              minWidth: 120,
            }}
          />
        ) : (
          <span
            onClick={editor ? () => editor!.startRename(node.id, node.name) : undefined}
            style={{
              fontFamily: node.level === 0 ? 'var(--font-display)' : 'inherit',
              fontStyle: node.level === 0 ? 'italic' : 'normal',
              fontWeight: node.level === 0 ? 600 : 600,
              fontSize: LEVEL_SIZE[node.level],
              color: isDone ? 'var(--mute)' : LEVEL_COLOR[node.level],
              textDecoration: isDone ? 'line-through' : 'none',
              cursor: editor ? 'text' : 'default',
              transition: 'color 0.2s ease',
            }}
          >
            {node.name}
          </span>
        )}

        {isLeaf && isEditingDuration && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              type="number"
              min="0"
              step="0.5"
              value={editor!.durationDraftValue}
              onChange={(e) => editor!.changeDurationDraftValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') editor!.commitDuration()
                if (e.key === 'Escape') editor!.cancelDuration()
              }}
              style={{ width: 56, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--gold)', fontSize: 12.5 }}
            />
            <select
              value={editor!.durationDraftUnit}
              onChange={(e) => editor!.changeDurationDraftUnit(e.target.value as DurationUnit)}
              style={{ padding: '2px 4px', borderRadius: 6, border: '1px solid var(--gold)', fontSize: 12.5 }}
            >
              {DURATION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button className="btn-outline" style={{ fontSize: 11.5 }} onClick={() => editor!.commitDuration()}>
              ✓
            </button>
          </span>
        )}
        {node.duration && isLeaf && !isEditingDuration && (
          <span
            className="outline-badge"
            onClick={editor ? () => editor!.startDuration(node.id, node.duration!.value, node.duration!.unit) : undefined}
            style={{ cursor: editor ? 'pointer' : 'default' }}
          >
            {formatDurationShort(node.duration)}
          </span>
        )}
        {!isLeaf && (
          <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600 }}>{formatHours(minutes)} total</span>
        )}
        {rangeLabel && <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{rangeLabel}</span>}

        {editor && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPendingDelete ? (
              <>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Delete?</span>
                <button className="btn-outline" style={{ fontSize: 11.5, color: 'var(--rose)' }} onClick={() => editor!.confirmDelete()}>
                  Yes
                </button>
                <button className="btn-outline" style={{ fontSize: 11.5 }} onClick={() => editor!.cancelDelete()}>
                  No
                </button>
              </>
            ) : (
              <button
                className="btn-outline"
                style={{ fontSize: 12, opacity: 0.6 }}
                onClick={() => editor!.requestDelete(node.id)}
                aria-label={`Delete ${node.name}`}
              >
                ✕
              </button>
            )}
          </span>
        )}
      </div>

      {node.children.length > 0 &&
        (editor ? (
          <SortableContext items={node.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {node.children.map((child) => (
              <OutlineNodeView
                key={child.id}
                node={child}
                scheduleIndex={scheduleIndex}
                checkable={checkable}
                completedIds={completedIds}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </SortableContext>
        ) : (
          <div>
            {node.children.map((child) => (
              <OutlineNodeView
                key={child.id}
                node={child}
                scheduleIndex={scheduleIndex}
                checkable={checkable}
                completedIds={completedIds}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        ))}
    </div>
  )
}

export default memo(OutlineNodeView)
