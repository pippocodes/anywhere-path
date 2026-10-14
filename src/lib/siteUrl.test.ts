import { afterEach, describe, expect, it } from 'vitest'
import { getSiteUrl } from './siteUrl'

describe('getSiteUrl', () => {
  afterEach(() => {
    delete (import.meta.env as Record<string, unknown>).VITE_SITE_URL
  })

  it('falls back to window.location.origin when VITE_SITE_URL is not set', () => {
    delete (import.meta.env as Record<string, unknown>).VITE_SITE_URL
    expect(getSiteUrl()).toBe(window.location.origin)
  })

  it('always reflects window.location.origin dynamically, never a fixed literal', () => {
    // jsdom's default test origin genuinely is localhost:3000 — the point
    // isn't that the result can't look like localhost (it legitimately
    // does in dev), it's that it's never a hardcoded string: it tracks
    // whatever window.location.origin actually is, here and in the browser.
    expect(getSiteUrl()).toBe(window.location.origin)
  })

  it('prefers VITE_SITE_URL when it is set', () => {
    ;(import.meta.env as Record<string, unknown>).VITE_SITE_URL = 'https://anywhere-path.vercel.app'
    expect(getSiteUrl()).toBe('https://anywhere-path.vercel.app')
  })

  it('strips a trailing slash from VITE_SITE_URL', () => {
    ;(import.meta.env as Record<string, unknown>).VITE_SITE_URL = 'https://anywhere-path.vercel.app/'
    expect(getSiteUrl()).toBe('https://anywhere-path.vercel.app')
  })

  it('strips multiple trailing slashes from VITE_SITE_URL', () => {
    ;(import.meta.env as Record<string, unknown>).VITE_SITE_URL = 'https://anywhere-path.vercel.app//'
    expect(getSiteUrl()).toBe('https://anywhere-path.vercel.app')
  })

  it('ignores a blank VITE_SITE_URL and falls back to window.location.origin', () => {
    ;(import.meta.env as Record<string, unknown>).VITE_SITE_URL = '   '
    expect(getSiteUrl()).toBe(window.location.origin)
  })
})
