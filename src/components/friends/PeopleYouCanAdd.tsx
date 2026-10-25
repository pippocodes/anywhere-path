import { useEffect, useState } from 'react'
import { fetchPeopleYouCanAdd, getErrorMessage } from '../../lib/friendsApi'
import type { PublicProfile } from '../../types/friends'
import Avatar from '../ui/Avatar'
import Skeleton from '../ui/Skeleton'

const PAGE_SIZE = 12

interface Props {
  onAdd: (userId: string) => Promise<void>
}

/**
 * Public-profile discovery list — entirely server-filtered (see
 * people_you_can_add() in schema.sql), so this component does no
 * filtering of its own: whatever the RPC returns is shown as-is.
 */
function PeopleYouCanAdd({ onAdd }: Props) {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPeopleYouCanAdd(PAGE_SIZE, 0)
      .then((data) => {
        if (cancelled) return
        setPeople(data)
        setOffset(data.length)
        setHasMore(data.length === PAGE_SIZE)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load people to add.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await fetchPeopleYouCanAdd(PAGE_SIZE, offset)
      setPeople((prev) => [...prev, ...data])
      setOffset((prev) => prev + data.length)
      setHasMore(data.length === PAGE_SIZE)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load more.'))
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleAdd(id: string) {
    setAddingId(id)
    try {
      await onAdd(id)
      setRequestedIds((prev) => new Set(prev).add(id))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send request.'))
    } finally {
      setAddingId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="micro-label" style={{ marginBottom: 10 }}>
          People you can add
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 280px))', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: '16px 18px' }}>
              <Skeleton width={40} height={40} radius={20} style={{ marginBottom: 10 }} />
              <Skeleton width="60%" height={13} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (people.length === 0 && !error) return null

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 10 }}>
        People you can add
      </div>
      {error && (
        <div className="auth-notice auth-notice-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 280px))', gap: 12 }}>
        {people.map((p, i) => {
          const requested = requestedIds.has(p.id)
          return (
            <div key={p.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar label={p.username} size={40} colorIndex={i} />
                <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.username}
                </span>
              </div>
              {p.about && (
                <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: 0, lineHeight: 1.5 }}>{p.about}</p>
              )}
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: 12, alignSelf: 'flex-start' }}
                onClick={() => handleAdd(p.id)}
                disabled={requested || addingId === p.id}
              >
                {requested ? 'Requested' : addingId === p.id ? 'Sending…' : 'Add'}
              </button>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <button type="button" className="btn-outline" style={{ fontSize: 12.5, marginTop: 14 }} onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}

export default PeopleYouCanAdd
