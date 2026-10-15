import { useState, type FormEvent } from 'react'
import type { Course, Habit, HabitCategory, Plan } from '../../types'
import { CATEGORY_COLOR_PRESETS } from './colorPresets'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AddHabitForm, { type AddHabitInput } from './AddHabitForm'

interface Props {
  open: boolean
  onClose: () => void
  categories: HabitCategory[]
  archivedCategories: HabitCategory[]
  habitsByCategory: Map<string, Habit[]>
  uncategorizedHabits: Habit[]
  archivedHabits: Habit[]
  courses: Course[]
  plans: Plan[]
  addHabit: (input: AddHabitInput & { categoryId: string | null }) => void
  renameHabit: (id: string, name: string) => void
  archiveHabit: (id: string, archived?: boolean) => void
  deleteHabit: (id: string) => void
  addHabitCategory: (name: string, color: string) => void
  renameHabitCategory: (id: string, name: string) => void
  setHabitCategoryColor: (id: string, color: string) => void
  archiveHabitCategory: (id: string, archived?: boolean) => void
  deleteHabitCategory: (id: string) => void
}

/** The single side sheet for every add/rename/recolor/archive action across categories and habits — kept off the main grid entirely. */
function HabitManageSheet({
  open,
  onClose,
  categories,
  archivedCategories,
  habitsByCategory,
  uncategorizedHabits,
  archivedHabits,
  courses,
  plans,
  addHabit,
  renameHabit,
  archiveHabit,
  deleteHabit,
  addHabitCategory,
  renameHabitCategory,
  setHabitCategoryColor,
  archiveHabitCategory,
  deleteHabitCategory,
}: Props) {
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState<string>(CATEGORY_COLOR_PRESETS[0])
  const [showArchived, setShowArchived] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleAddCategory(e: FormEvent) {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    addHabitCategory(trimmed, newCategoryColor)
    setNewCategoryName('')
    setNewCategoryColor(CATEGORY_COLOR_PRESETS[0])
    setAddingCategory(false)
  }

  return (
    <Modal open={open} onClose={onClose} variant="sheet" title="Manage habits">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {categories.map((cat) => (
          <CategoryEditor
            key={cat.id}
            category={cat}
            habits={habitsByCategory.get(cat.id) ?? []}
            courses={courses}
            plans={plans}
            onRename={(name) => renameHabitCategory(cat.id, name)}
            onSetColor={(color) => setHabitCategoryColor(cat.id, color)}
            onArchive={() => archiveHabitCategory(cat.id)}
            onAddHabit={(input) => addHabit({ ...input, categoryId: cat.id })}
            onRenameHabit={renameHabit}
            onArchiveHabit={(id) => archiveHabit(id)}
          />
        ))}

        {uncategorizedHabits.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <div className="micro-label" style={{ marginBottom: 10 }}>
              Uncategorized
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uncategorizedHabits.map((h) => (
                <HabitRow key={h.id} habit={h} onRename={(name) => renameHabit(h.id, name)} onArchive={() => archiveHabit(h.id)} />
              ))}
            </div>
          </div>
        )}

        {addingCategory ? (
          <form onSubmit={handleAddCategory} className="card" style={{ padding: 16 }}>
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g. Study)"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {CATEGORY_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategoryColor(c)}
                  aria-label={`Use color ${c}`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: c === newCategoryColor ? '2px solid var(--cream)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="submit" size="sm">
                Add Category
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddingCategory(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAddingCategory(true)}>
            + New category
          </Button>
        )}

        {(archivedCategories.length > 0 || archivedHabits.length > 0) && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <button className="btn-outline" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide' : 'Show'} archived ({archivedCategories.length + archivedHabits.length})
            </button>
            {showArchived && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {archivedCategories.map((c) => (
                  <ArchivedRow
                    key={c.id}
                    label={c.name}
                    kind="category"
                    confirming={confirmDeleteId === c.id}
                    onUnarchive={() => archiveHabitCategory(c.id, false)}
                    onConfirmDelete={() => setConfirmDeleteId(c.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onDelete={() => {
                      deleteHabitCategory(c.id)
                      setConfirmDeleteId(null)
                    }}
                  />
                ))}
                {archivedHabits.map((h) => (
                  <ArchivedRow
                    key={h.id}
                    label={h.name}
                    kind="habit"
                    confirming={confirmDeleteId === h.id}
                    onUnarchive={() => archiveHabit(h.id, false)}
                    onConfirmDelete={() => setConfirmDeleteId(h.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onDelete={() => {
                      deleteHabit(h.id)
                      setConfirmDeleteId(null)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function CategoryEditor({
  category,
  habits,
  courses,
  plans,
  onRename,
  onSetColor,
  onArchive,
  onAddHabit,
  onRenameHabit,
  onArchiveHabit,
}: {
  category: HabitCategory
  habits: Habit[]
  courses: Course[]
  plans: Plan[]
  onRename: (name: string) => void
  onSetColor: (color: string) => void
  onArchive: () => void
  onAddHabit: (input: AddHabitInput) => void
  onRenameHabit: (id: string, name: string) => void
  onArchiveHabit: (id: string) => void
}) {
  const [nameDraft, setNameDraft] = useState(category.name)
  const [pickingColor, setPickingColor] = useState(false)
  const [addingHabit, setAddingHabit] = useState(false)

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== category.name) onRename(trimmed)
    else setNameDraft(category.name)
  }

  function handleAddHabit(input: AddHabitInput) {
    onAddHabit(input)
    setAddingHabit(false)
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setPickingColor((v) => !v)}
          aria-label="Category color"
          style={{ width: 16, height: 16, borderRadius: '50%', background: category.color, border: 'none', cursor: 'pointer', flexShrink: 0 }}
        />
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === 'Enter' && commitName()}
          style={{ flex: 1, fontSize: 14, fontWeight: 600, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--cream)' }}
        />
        <button className="btn-outline" style={{ fontSize: 12 }} onClick={onArchive}>
          Archive
        </button>
      </div>

      {pickingColor && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {CATEGORY_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onSetColor(c)
                setPickingColor(false)
              }}
              aria-label={`Use color ${c}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: c,
                border: c === category.color ? '2px solid var(--cream)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {habits.map((h) => (
          <HabitRow key={h.id} habit={h} onRename={(name) => onRenameHabit(h.id, name)} onArchive={() => onArchiveHabit(h.id)} />
        ))}
      </div>

      {addingHabit ? (
        <AddHabitForm courses={courses} plans={plans} onAdd={handleAddHabit} onCancel={() => setAddingHabit(false)} />
      ) : (
        <button className="btn-outline" style={{ marginTop: 10, fontSize: 12.5 }} onClick={() => setAddingHabit(true)}>
          + Add habit
        </button>
      )}
    </div>
  )
}

function HabitRow({ habit, onRename, onArchive }: { habit: Habit; onRename: (name: string) => void; onArchive: () => void }) {
  const [draft, setDraft] = useState(habit.name)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== habit.name) onRename(trimmed)
    else setDraft(habit.name)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        style={{ flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'transparent', color: 'var(--cream)' }}
      />
      <button className="btn-outline" style={{ fontSize: 11.5 }} onClick={onArchive}>
        Archive
      </button>
    </div>
  )
}

function ArchivedRow({
  label,
  kind,
  confirming,
  onUnarchive,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  label: string
  kind: 'category' | 'habit'
  confirming: boolean
  onUnarchive: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span>
        {label} <span style={{ color: 'var(--mute)', fontSize: 11.5 }}>({kind})</span>
      </span>
      {confirming ? (
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Delete permanently?</span>
          <button className="btn-outline" style={{ color: 'var(--rose)', fontSize: 11.5 }} onClick={onDelete}>
            Yes
          </button>
          <button className="btn-outline" style={{ fontSize: 11.5 }} onClick={onCancelDelete}>
            Cancel
          </button>
        </span>
      ) : (
        <span style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ fontSize: 11.5 }} onClick={onUnarchive}>
            Unarchive
          </button>
          <button className="btn-outline" style={{ fontSize: 11.5, opacity: 0.75 }} onClick={onConfirmDelete}>
            Delete
          </button>
        </span>
      )}
    </div>
  )
}

export default HabitManageSheet
