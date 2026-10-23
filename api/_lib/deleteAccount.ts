// Pure helpers for /api/delete-account — kept framework/SDK-free so they're
// directly unit-testable without mocking the Supabase admin client.

export interface ConfirmValidation {
  valid: boolean
  error?: string
}

/**
 * The client's type-username-to-confirm modal already requires an exact
 * match before enabling its submit button — this re-checks it server-side
 * too (defense in depth: never trust the client alone for an irreversible
 * action). Case-sensitive, exact match only — no trimming leniency, since
 * the modal shows the exact username to type.
 */
export function validateConfirmUsername(confirmUsername: unknown, actualUsername: string): ConfirmValidation {
  if (typeof confirmUsername !== 'string') return { valid: false, error: 'Type your username to confirm.' }
  if (confirmUsername !== actualUsername) {
    return { valid: false, error: 'That username does not match — type it exactly to confirm deletion.' }
  }
  return { valid: true }
}
