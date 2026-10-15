import Modal from '../ui/Modal'
import Button from '../ui/Button'

export type NextItemOffer =
  | { kind: 'course'; habitName: string; courseId: string; moduleId: string; topicId: string; title: string }
  | { kind: 'plan'; habitName: string; planId: string; stepId: string; title: string }

interface Props {
  offer: NextItemOffer | null
  onConfirm: () => void
  onDismiss: () => void
}

/** Shown right after a linked habit is ticked fully done — offers to also mark the next incomplete course module / plan step done, so ticking the habit and working through the source stay in sync without a second trip. */
function NextStepOfferModal({ offer, onConfirm, onDismiss }: Props) {
  return (
    <Modal open={!!offer} onClose={onDismiss} title="Nice work">
      {offer && (
        <div>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 18 }}>
            Mark <strong style={{ color: 'var(--cream)' }}>&ldquo;{offer.title}&rdquo;</strong> done too?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={onConfirm}>Yes, mark it done</Button>
            <Button variant="secondary" onClick={onDismiss}>
              Not yet
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default NextStepOfferModal
