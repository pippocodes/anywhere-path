import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { parseOutline, computeTotalMinutes, formatHours } from '../utils/outlineParser'
import OutlineNodeView from '../components/OutlineNodeView'

const SAMPLE_OUTLINE = [
  'Data Structures & Algorithms (8w)',
  '  Linear Structures',
  '    Arrays (5h)',
  '    Linked Lists (6h)',
  '    Stacks & Queues (5h)',
  '  Algorithms',
  '    Sorting',
  '      Bubble & Insertion Sort (2h)',
  '      Merge & Quick Sort (3h)',
  '    Searching (4h)',
  '    Dynamic Programming (8h)',
].join('\n')

function RoadmapOutline() {
  const { data, addRoadmapDoc, updateRoadmapDoc, deleteRoadmapDoc } = useApp()

  const [title, setTitle] = useState('')
  const [outlineText, setOutlineText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const parsed = useMemo(() => parseOutline(outlineText), [outlineText])
  const totalMinutes = useMemo(() => computeTotalMinutes(parsed.nodes), [parsed.nodes])
  const canSave = parsed.errors.length === 0 && parsed.nodes.length > 0

  function handleSave() {
    if (!canSave) return
    const finalTitle = title.trim() || parsed.nodes[0].name
    if (editingId) {
      updateRoadmapDoc(editingId, finalTitle, outlineText)
    } else {
      const doc = addRoadmapDoc(finalTitle, outlineText)
      setEditingId(doc.id)
    }
    setTitle(finalTitle)
  }

  function handleNew() {
    setTitle('')
    setOutlineText('')
    setEditingId(null)
    setConfirmDeleteId(null)
  }

  function handleEdit(id: string) {
    const doc = data.roadmapDocs.find((d) => d.id === id)
    if (!doc) return
    setTitle(doc.title)
    setOutlineText(doc.outlineText)
    setEditingId(doc.id)
    setConfirmDeleteId(null)
  }

  function handleDelete(id: string) {
    deleteRoadmapDoc(id)
    if (editingId === id) handleNew()
    setConfirmDeleteId(null)
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Roadmap Builder</h1>
          <p className="page-subtitle" style={{ marginBottom: 20 }}>
            Type or paste an outline — indent with 2 spaces or a tab per level. Topic → Subtopic → Module →
            Sub-module, up to 4 levels deep. Add a duration at the end of any line, like{' '}
            <code>(2h)</code>, <code>(45m)</code>, <code>(3d)</code> or <code>(2w)</code>.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--rose)' }}>
          Have an existing course? <Link to="/courses" style={{ textDecoration: 'underline' }}>Build its roadmap the classic way</Link>.
        </p>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Roadmap name (defaults to your first topic)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--pink-pale)',
          fontSize: 15,
          marginBottom: 16,
        }}
      />

      <div className="outline-layout">
        <div>
          <textarea
            className="outline-textarea"
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder={`Web Development (2w)\n  Frontend Basics\n    HTML Basics (4h)\n    CSS Fundamentals (5h)\n  Shipping It\n    Deploy (2h)`}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" disabled={!canSave} onClick={handleSave}>
              {editingId ? 'Update Roadmap' : 'Save Roadmap'}
            </button>
            {outlineText === '' && (
              <button className="btn-secondary btn" onClick={() => setOutlineText(SAMPLE_OUTLINE)}>
                Load an Example
              </button>
            )}
            {(outlineText !== '' || editingId) && (
              <button className="btn-outline" style={{ color: 'var(--plum)' }} onClick={handleNew}>
                Start a New Roadmap
              </button>
            )}
          </div>

          {parsed.errors.length > 0 && (
            <div className="outline-issues outline-issues-error">
              {parsed.errors.map((err, i) => (
                <div key={i}>⚠ Line {err.line}: {err.message}</div>
              ))}
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="outline-issues outline-issues-warning">
              {parsed.warnings.map((w, i) => (
                <div key={i}>Line {w.line}: {w.message}</div>
              ))}
            </div>
          )}
        </div>

        <div className="card outline-preview">
          {parsed.nodes.length === 0 ? (
            <p style={{ color: 'var(--rose)', fontSize: 14 }}>
              Start typing on the left — your roadmap will take shape here as you go.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>
                  {parsed.nodes.length} topic{parsed.nodes.length === 1 ? '' : 's'}
                </span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                  {formatHours(totalMinutes)} total
                </span>
              </div>
              {parsed.nodes.map((node) => (
                <OutlineNodeView key={node.id} node={node} />
              ))}
            </>
          )}
        </div>
      </div>

      {data.roadmapDocs.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Your Saved Roadmaps</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.roadmapDocs.map((doc) => {
              const docParsed = parseOutline(doc.outlineText)
              const docMinutes = computeTotalMinutes(docParsed.nodes)
              return (
                <div key={doc.id} className="card outline-doc-card">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--rose)', marginTop: 2 }}>
                      {docParsed.nodes.length} topic{docParsed.nodes.length === 1 ? '' : 's'} · {formatHours(docMinutes)} total
                    </div>
                  </div>
                  {confirmDeleteId === doc.id ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--plum)' }}>Delete this roadmap?</span>
                      <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => handleDelete(doc.id)}>
                        Yes, delete
                      </button>
                      <button className="btn-outline" style={{ color: 'var(--rose)' }} onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button className="btn-outline" onClick={() => handleEdit(doc.id)}>
                        Edit
                      </button>
                      <button className="btn-outline" style={{ opacity: 0.75 }} onClick={() => setConfirmDeleteId(doc.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapOutline
