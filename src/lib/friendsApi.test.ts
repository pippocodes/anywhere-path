import { describe, it, expect } from 'vitest'
import { getErrorMessage, isFreePlanLimitError, FREE_PLAN_SHARE_LIMIT_PREFIX } from './friendsApi'

describe('getErrorMessage', () => {
  it('reads .message off a real Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('reads .message off a plain PostgrestError-shaped object (not instanceof Error)', () => {
    const postgrestError = { message: 'duplicate key value', details: '...', hint: null, code: '23505' }
    expect(getErrorMessage(postgrestError)).toBe('duplicate key value')
  })

  it('falls back when the error has no usable message', () => {
    expect(getErrorMessage(null, 'fallback text')).toBe('fallback text')
    expect(getErrorMessage(undefined, 'fallback text')).toBe('fallback text')
    expect(getErrorMessage('a plain string', 'fallback text')).toBe('fallback text')
    expect(getErrorMessage({ code: '23505' }, 'fallback text')).toBe('fallback text')
  })

  it('uses the default fallback when none is given', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong — try again.')
  })
})

describe('isFreePlanLimitError', () => {
  it('detects the free-plan limit error from a PostgrestError-shaped object', () => {
    const error = { message: `${FREE_PLAN_SHARE_LIMIT_PREFIX}: the free plan allows sharing up to 2 items.` }
    expect(isFreePlanLimitError(error)).toBe(true)
  })

  it('detects it from a real Error too', () => {
    expect(isFreePlanLimitError(new Error(`${FREE_PLAN_SHARE_LIMIT_PREFIX}: nope`))).toBe(true)
  })

  it('is false for unrelated errors', () => {
    expect(isFreePlanLimitError(new Error('network error'))).toBe(false)
    expect(isFreePlanLimitError({ message: 'permission denied' })).toBe(false)
  })

  it('is false for a nullish or message-less error, without throwing', () => {
    expect(isFreePlanLimitError(null)).toBe(false)
    expect(isFreePlanLimitError(undefined)).toBe(false)
    expect(isFreePlanLimitError({})).toBe(false)
  })
})
