import { useEffect, useRef, useState } from 'react'
import type { Course } from '../types'
import { makeId } from '../utils/id'

interface DraftTopic {
  key: string
  name: string
  hours: string
}

interface DraftModule {
  key: string
  name: string
  topics: DraftTopic[]
}

interface Props {
  onSave: (course: Course) => void
  onCancel: () => void
}

function AddCourseForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [modules, setModules] = useState<DraftModule[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus the course-name field the moment this form appears.
  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  function addModule() {
    setModules((prev) => [...prev, { key: makeId('mod'), name: '', topics: [] }])
  }

  function setModuleName(key: string, value: string) {
    setModules((prev) => prev.map((m) => (m.key === key ? { ...m, name: value } : m)))
  }

  function addTopic(moduleKey: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey ? { ...m, topics: [...m.topics, { key: makeId('top'), name: '', hours: '' }] } : m
      )
    )
  }

  function setTopicField(moduleKey: string, topicKey: string, field: 'name' | 'hours', value: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.key !== moduleKey
          ? m
          : { ...m, topics: m.topics.map((t) => (t.key === topicKey ? { ...t, [field]: value } : t)) }
      )
    )
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const finalModules = modules
      .filter((m) => m.name.trim())
      .map((m) => ({
        id: makeId('mod'),
        name: m.name.trim(),
        topics: m.topics
          .filter((t) => t.name.trim())
          .map((t) => ({
            id: makeId('top'),
            name: t.name.trim(),
            hours: Number(t.hours) || 1,
            done: false,
          })),
      }))

    onSave({ id: makeId('course'), name: trimmedName, modules: finalModules, isCustom: true })
  }

  return (
    <div className="card" style={{ marginBottom: 32, border: '1px solid var(--pink-pale)' }}>
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>New Course</h3>

      <input
        ref={nameInputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Course name (e.g. Watercolor Painting)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--pink-pale)',
          fontSize: 15,
          marginBottom: 18,
        }}
      />

      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 10 }}>Modules</div>

      {modules.map((mod) => (
        <div key={mod.key} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <input
            value={mod.name}
            onChange={(e) => setModuleName(mod.key, e.target.value)}
            placeholder="Module name"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--pink-pale)',
              fontSize: 14,
              marginBottom: 10,
            }}
          />
          {mod.topics.map((topic) => (
            <div key={topic.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={topic.name}
                onChange={(e) => setTopicField(mod.key, topic.key, 'name', e.target.value)}
                placeholder="Topic name"
                style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--pink-pale)', fontSize: 13.5 }}
              />
              <input
                value={topic.hours}
                onChange={(e) => setTopicField(mod.key, topic.key, 'hours', e.target.value)}
                placeholder="hrs"
                style={{ width: 60, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--pink-pale)', fontSize: 13.5 }}
              />
            </div>
          ))}
          <button className="btn-outline" onClick={() => addTopic(mod.key)}>
            + Add Topic
          </button>
        </div>
      ))}

      <button className="btn-outline" style={{ color: 'var(--plum)', marginBottom: 20 }} onClick={addModule}>
        + Add Module
      </button>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn" style={{ background: 'var(--mute)' }} onClick={handleSave}>
          Save Course
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default AddCourseForm
