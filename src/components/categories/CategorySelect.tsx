import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { HabitCategory } from '../../types'
import { CATEGORY_COLOR_PRESETS } from '../habits/colorPresets'
import { DEFAULT_CATEGORY_SUGGESTIONS, categoryColor, categoryLabel } from '../../utils/courseCategory'

interface Props {
  categories: HabitCategory[]
  value: string | null
  onChange: (id: string | null) => void
  usageCount: (categoryId: string) => number
  onCreateCategory: (name: string, color: string) => HabitCategory
  onRenameCategory: (id: string, name: string) => void
  onSetCategoryColor: (id: string, color: string) => void
  onDeleteCategory: (id: string) => void
  label?: string
}

/** Searchable pill-chip dropdown for picking a course's category, with inline "+ New category" and a manage panel (rename/recolor/delete) — shared by both Roadmap Builder tabs and reusable wherever a course's category needs picking. */
function CategorySelect({
  categories,
  value,
  onChange,
  usageCount,
  onCreateCategory,
  onRenameCategory,
  onSetCategoryColor,
  onDeleteCategory,
  label,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [managing, setManaging] = useState(false)
  const [addingName, setAddingName] = useState('')
  const [addingColor, setAddingColor] = useState<string>(CATEGORY_COLOR_PRESETS[0])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setManaging(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const query = search.trim().toLowerCase()
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(query))
  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()))
  const suggestions = DEFAULT_CATEGORY_SUGGESTIONS.filter(
    (s) => !existingNames.has(s.toLowerCase()) && s.toLowerCase().includes(query)
  )

  function selectCategory(id: string | null) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function handleQuickAdd(name: string) {
    const color = CATEGORY_COLOR_PRESETS[categories.length % CATEGORY_COLOR_PRESETS.length]
    selectCategory(onCreateCategory(name, color).id)
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    const trimmed = addingName.trim()
    if (!trimmed) return
    const created = onCreateCategory(trimmed, addingColor)
    setAddingName('')
    setAddingColor(CATEGORY_COLOR_PRESETS[0])
    selectCategory(created.id)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      {label && <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mute)', marginBottom: 6 }}>{label}</div>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-outline"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: categoryColor(categories, value), flexShrink: 0 }} />
        {categoryLabel(categories, value)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 40,
              width: 290,
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 20px 50px var(--shadow)',
            }}
          >
            {!managing ? (
              <>
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, marginBottom: 10 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
                  <ChipOption label="Other" color="var(--line)" active={value === null} onClick={() => selectCategory(null)} />
                  {filteredCategories.map((c) => (
                    <ChipOption key={c.id} label={c.name} color={c.color} active={c.id === value} onClick={() => selectCategory(c.id)} />
                  ))}
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleQuickAdd(s)}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)' }}
                    >
                      + {s}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && suggestions.length === 0 && query && (
                    <span style={{ fontSize: 12, color: 'var(--mute)' }}>No matches.</span>
                  )}
                </div>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input
                    value={addingName}
                    onChange={(e) => setAddingName(e.target.value)}
                    placeholder="+ New category"
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12.5 }}
                  />
                  <button type="submit" className="btn" style={{ padding: '6px 10px', fontSize: 12 }} disabled={!addingName.trim()}>
                    Add
                  </button>
                </form>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {CATEGORY_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAddingColor(c)}
                      aria-label={`Use color ${c}`}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: c,
                        border: c === addingColor ? '2px solid var(--cream)' : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
                {categories.length > 0 && (
                  <button type="button" className="btn-outline" style={{ fontSize: 12, width: '100%' }} onClick={() => setManaging(true)}>
                    Manage categories
                  </button>
                )}
              </>
            ) : (
              <ManageCategories
                categories={categories}
                usageCount={usageCount}
                onRename={onRenameCategory}
                onSetColor={onSetCategoryColor}
                onDelete={onDeleteCategory}
                onBack={() => setManaging(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChipOption({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        padding: '5px 10px',
        borderRadius: 999,
        border: active ? '1px solid var(--cream)' : '1px solid var(--line)',
        background: active ? 'color-mix(in srgb, var(--text) 8%, transparent)' : 'transparent',
        color: 'var(--cream)',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </button>
  )
}

function ManageCategories({
  categories,
  usageCount,
  onRename,
  onSetColor,
  onDelete,
  onBack,
}: {
  categories: HabitCategory[]
  usageCount: (id: string) => number
  onRename: (id: string, name: string) => void
  onSetColor: (id: string, color: string) => void
  onDelete: (id: string) => void
  onBack: () => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mute)' }}>Manage categories</span>
        <button type="button" className="btn-outline" style={{ fontSize: 11.5 }} onClick={onBack}>
          Back
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
        {categories.length === 0 && <span style={{ fontSize: 12, color: 'var(--mute)' }}>No categories yet.</span>}
        {categories.map((c) => (
          <CategoryManageRow
            key={c.id}
            category={c}
            usage={usageCount(c.id)}
            confirming={confirmId === c.id}
            onRename={(name) => onRename(c.id, name)}
            onSetColor={(color) => onSetColor(c.id, color)}
            onRequestDelete={() => setConfirmId(c.id)}
            onCancelDelete={() => setConfirmId(null)}
            onConfirmDelete={() => {
              onDelete(c.id)
              setConfirmId(null)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryManageRow({
  category,
  usage,
  confirming,
  onRename,
  onSetColor,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  category: HabitCategory
  usage: number
  confirming: boolean
  onRename: (name: string) => void
  onSetColor: (color: string) => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const [draft, setDraft] = useState(category.name)
  const [pickingColor, setPickingColor] = useState(false)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== category.name) onRename(trimmed)
    else setDraft(category.name)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => setPickingColor((v) => !v)}
          aria-label="Category color"
          style={{ width: 14, height: 14, borderRadius: '50%', background: category.color, border: 'none', flexShrink: 0, cursor: 'pointer' }}
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          style={{ flex: 1, fontSize: 12.5, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', color: 'var(--cream)' }}
        />
        <button type="button" className="btn-outline" style={{ fontSize: 11 }} onClick={onRequestDelete}>
          Delete
        </button>
      </div>
      {pickingColor && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 22 }}>
          {CATEGORY_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onSetColor(c)
                setPickingColor(false)
              }}
              aria-label={`Use color ${c}`}
              style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: c === category.color ? '2px solid var(--cream)' : '2px solid transparent' }}
            />
          ))}
        </div>
      )}
      {confirming && (
        <div className="outline-issues outline-issues-warning" style={{ marginTop: 6, fontSize: 11.5, padding: '8px 10px' }}>
          {usage > 0 ? `This will move ${usage} course${usage === 1 ? '' : 's'} to "Other".` : 'Delete this category?'}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="button" className="btn" style={{ padding: '5px 10px', fontSize: 11 }} onClick={onConfirmDelete}>
              Yes, delete
            </button>
            <button type="button" className="btn-outline" style={{ fontSize: 11 }} onClick={onCancelDelete}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategorySelect
