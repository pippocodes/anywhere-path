import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (fields: { name: string; platform: string; instructor: string }) => void
}

/** Side sheet for creating a new course — title plus optional platform/instructor. */
function AddCourseSheet({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [instructor, setInstructor] = useState('')

  function reset() {
    setName('')
    setPlatform('')
    setInstructor('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({ name: trimmed, platform: platform.trim(), instructor: instructor.trim() })
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} variant="sheet" title="New course">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="course-name">Course title</label>
          <input
            id="course-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="course-platform">Platform (optional)</label>
          <input id="course-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Udemy, YouTube" />
        </div>
        <div className="field">
          <label htmlFor="course-instructor">Instructor (optional)</label>
          <input id="course-instructor" value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="e.g. Jane Smith" />
        </div>
        <Button type="submit" disabled={!name.trim()} style={{ width: '100%' }}>
          Create course
        </Button>
      </form>
    </Modal>
  )
}

export default AddCourseSheet
