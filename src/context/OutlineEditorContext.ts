import { createContext, useContext } from 'react'
import type { DurationUnit } from '../types'
import type { ScheduledItem } from '../utils/scheduler'

/**
 * Drives the inline rename/duration/delete controls on each node of the
 * editable outline tree in RoadmapOutline. Scoped to that page — created
 * fresh per render there, not a global provider like AppContext.
 */
export interface OutlineEditorApi {
  scheduleIndex: Map<string, ScheduledItem> | null

  editingNameId: string | null
  nameDraft: string
  startRename: (id: string, currentName: string) => void
  changeNameDraft: (value: string) => void
  commitRename: () => void
  cancelRename: () => void

  editingDurationId: string | null
  durationDraftValue: string
  durationDraftUnit: DurationUnit
  startDuration: (id: string, value: number, unit: DurationUnit) => void
  changeDurationDraftValue: (value: string) => void
  changeDurationDraftUnit: (unit: DurationUnit) => void
  commitDuration: () => void
  cancelDuration: () => void

  pendingDeleteId: string | null
  requestDelete: (id: string) => void
  confirmDelete: () => void
  cancelDelete: () => void
}

export const OutlineEditorContext = createContext<OutlineEditorApi | null>(null)

/** Returns null (not a throwing hook) — the tree also renders read-only wherever nothing provides this. */
export function useOutlineEditor(): OutlineEditorApi | null {
  return useContext(OutlineEditorContext)
}
