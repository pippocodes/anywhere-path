import { describe, it, expect } from 'vitest'
import { urlBase64ToUint8Array } from './usePushSubscription'

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string with no padding (the VAPID public key format)', () => {
    // "hello" in base64url, no padding
    const result = urlBase64ToUint8Array('aGVsbG8')
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111])
  })

  it('handles the - and _ url-safe substitutions', () => {
    // bytes [0xfb, 0xff] -> base64 "+/8=" -> base64url "-_8"
    const result = urlBase64ToUint8Array('-_8')
    expect(Array.from(result)).toEqual([0xfb, 0xff])
  })

  it('decodes a string whose length is already a multiple of 4 (no padding needed)', () => {
    // "foo" in base64url
    const result = urlBase64ToUint8Array('Zm9v')
    expect(Array.from(result)).toEqual([102, 111, 111])
  })
})
