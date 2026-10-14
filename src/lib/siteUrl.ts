/**
 * The app's own origin, for building auth redirect URLs (email
 * confirmation, password reset) — never hardcode localhost. Prefers
 * VITE_SITE_URL (set this in Vercel to pin the canonical production
 * domain, e.g. when preview deployments shouldn't be used as the
 * redirect target) and otherwise falls back to the browser's current
 * origin, which is already correct for local dev and for any deployed
 * environment without needing separate per-environment config.
 */
export function getSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  return window.location.origin
}
