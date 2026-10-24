import { describe, it, expect } from 'vitest'
import { validateConfirmUsername } from './deleteAccount.js'

describe('validateConfirmUsername', () => {
  it('accepts an exact match', () => {
    expect(validateConfirmUsername('alex', 'alex')).toEqual({ valid: true })
  })

  it('rejects a mismatch', () => {
    expect(validateConfirmUsername('alexx', 'alex').valid).toBe(false)
  })

  it('rejects a case-mismatched attempt (exact match only)', () => {
    expect(validateConfirmUsername('Alex', 'alex').valid).toBe(false)
  })

  it('rejects a non-string value', () => {
    expect(validateConfirmUsername(undefined, 'alex').valid).toBe(false)
    expect(validateConfirmUsername(42, 'alex').valid).toBe(false)
  })

  it('rejects leading/trailing whitespace (must match exactly, no trimming)', () => {
    expect(validateConfirmUsername('alex ', 'alex').valid).toBe(false)
  })
})
