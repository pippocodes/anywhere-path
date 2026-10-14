import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  courseName: string
  linkedHabitCount: number
  linkedPlanCount: number
}

/** Confirms a course delete — names the course, says exactly what's cascaded vs. just unlinked, and keeps the destructive action visually separate from Cancel. */
function DeleteCourseModal({ open, onClose, onConfirm, courseName, linkedHabitCount, linkedPlanCount }: Props) {
  const hasLinks = linkedHabitCount > 0 || linkedPlanCount > 0
  return (
    <Modal open={open} onClose={onClose} variant="center" title="Delete this course?" width={440}>
      <p style={{ fontSize: 14.5, color: 'var(--cream)', marginBottom: 10 }}>
        <strong>{courseName}</strong>
      </p>
      <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: hasLinks ? 10 : 20, lineHeight: 1.6 }}>
        This will permanently remove the course, all its subtopics and modules, and your progress. This can't be
        undone.
      </p>
      {linkedHabitCount > 0 && (
        <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 6, lineHeight: 1.6 }}>
          {linkedHabitCount} habit{linkedHabitCount === 1 ? ' is' : 's are'} linked to this course — {linkedHabitCount === 1 ? 'it' : 'they'} will
          become unlinked, not deleted.
        </p>
      )}
      {linkedPlanCount > 0 && (
        <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 20, lineHeight: 1.6 }}>
          {linkedPlanCount} roadmap{linkedPlanCount === 1 ? ' is' : 's are'} linked to this course — {linkedPlanCount === 1 ? 'it' : 'they'} will
          become unlinked, not deleted.
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete course
        </Button>
      </div>
    </Modal>
  )
}

export default DeleteCourseModal
