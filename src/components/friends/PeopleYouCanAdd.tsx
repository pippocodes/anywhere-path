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
        <div className="card" style={{ padding: '18px 20px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 4px',
                borderBottom: i < 2 ? '1px solid var(--line)' : 'none',
              }}
            >
              <Skeleton width={40} height={40} radius={20} />
              <Skeleton width="40%" height={13} />
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
      <div className="card" style={{ padding: '18px 20px' }}>
        {people.map((p, i) => {
          const requested = requestedIds.has(p.id)
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                padding: '10px 4px',
                borderBottom: i < people.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar label={p.username} size={40} colorIndex={i} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{p.username}
                  </div>
                  {p.about && (
                    <div style={{ fontSize: 12, color: 'var(--mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {p.about}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: 12, flexShrink: 0 }}
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
