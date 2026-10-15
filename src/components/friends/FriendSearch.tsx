import { useEffect, useRef, useState } from 'react'
import { searchUsers, getErrorMessage } from '../../lib/friendsApi'

interface Props {
  knownUserIds: Set<string> // already a friend / pending / blocked — hide the "Add" button for these
  onAdd: (userId: string) => Promise<void>
}

/** Searches usernames (min 3 chars, debounced) via the search_users RPC — never touches email, server-enforced. */
function FriendSearch({ knownUserIds, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; username: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      searchUsers(trimmed)
        .then((data) => setResults(data))
        .catch(() => setError('Search failed — try again.'))
        .finally(() => setLoading(false))
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function handleAdd(id: string) {
    setAddingId(id)
    setError(null)
    try {
      await onAdd(id)
      setResults((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send request.'))
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="micro-label" style={{ marginBottom: 10 }}>
        Add a friend
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username (3+ characters)…"
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, marginBottom: 12 }}
      />
      {error && <div className="auth-notice auth-notice-error" style={{ marginBottom: 10 }}>{error}</div>}
      {loading && <p style={{ fontSize: 12.5, color: 'var(--mute)' }}>Searching…</p>}
      {!loading && query.trim().length >= 3 && results.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--mute)' }}>No matching usernames.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 2px' }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.username}</span>
            {knownUserIds.has(r.id) ? (
              <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Already connected</span>
            ) : (
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: 12 }}
                onClick={() => handleAdd(r.id)}
                disabled={addingId === r.id}
              >
                {addingId === r.id ? 'Sending…' : 'Add friend'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendSearch
