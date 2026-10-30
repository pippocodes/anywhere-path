/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Optional — shows a "Still need help?" contact link on the Help page
  // when set. Never invent a value for this; the section just hides
  // itself when it's unset.
  readonly VITE_SUPPORT_EMAIL?: string
  // Public half of the VAPID keypair push subscriptions are signed with —
  // safe to ship to the client (see docs/drafts/notifications-schema.sql
  // and the Settings > Notifications page). Push stays off without it.
  readonly VITE_VAPID_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
