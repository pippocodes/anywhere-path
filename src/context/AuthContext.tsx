import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { getSiteUrl } from '../lib/siteUrl'

export interface AuthResult {
  error: string | null
  // Set when the UI needs to react to *which* error this was (e.g. show a
  // "resend confirmation email" button), not just display the message.
  code?: string
  // The email actually used for the sign-in attempt — set on a failed login
  // so the UI can offer "resend confirmation email" even when the visitor
  // typed a username rather than an email.
  resolvedEmail?: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  username: string | null
  loading: boolean // still resolving the initial session on first load
  configured: boolean
  signUp: (email: string, password: string, username: string) => Promise<AuthResult>
  signIn: (identifier: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  checkUsernameAvailable: (username: string) => Promise<boolean | null>
  resendConfirmationEmail: (email: string) => Promise<AuthResult>
}

const GENERIC_LOGIN_ERROR = 'That email/username or password is incorrect.'
const NETWORK_ERROR = 'Network error — check your connection and try again.'

function devLog(label: string, error: AuthError | { message: string }) {
  if (!import.meta.env.DEV) return
  const status = 'status' in error ? (error as AuthError).status : undefined
  const code = 'code' in error ? (error as AuthError).code : undefined
  // eslint-disable-next-line no-console
  console.error(`[auth] ${label}`, { message: error.message, status, code })
}

/** Maps a Supabase sign-in AuthError to a friendly, specific message — see supabase/SETUP.md for the full catalogue this was built from. */
function mapSignInError(error: AuthError, resolvedEmail: string): AuthResult {
  devLog('signIn error', error)

  if (error.code === 'email_not_confirmed') {
    return {
      error: "Your email isn't confirmed yet. Check your inbox for the confirmation link, or resend it below.",
      code: 'email_not_confirmed',
      resolvedEmail,
    }
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return { error: 'Too many attempts — please wait a bit and try again.', code: 'rate_limited' }
  }
  if (!error.status || error.status >= 500) {
    return { error: NETWORK_ERROR, code: 'network_error' }
  }
  // invalid_credentials, and anything else — deliberately generic: this
  // covers both "wrong password" and "no such account", so a login
  // attempt never reveals whether a given email/username exists.
  return { error: GENERIC_LOGIN_ERROR, code: 'invalid_credentials' }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Drives the navbar and every gated screen reactively — signing in or
    // out anywhere in the app updates every consumer of useAuth() without
    // a page refresh, because they all read `session`/`user` from here.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  // The username lives in `profiles`, not in the auth session — fetch it
  // whenever the signed-in user changes, and clear it on sign-out.
  useEffect(() => {
    const userId = session?.user?.id
    if (!supabase || !userId) {
      setUsername(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setUsername(data?.username ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  async function signUp(email: string, password: string, username: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          // Never localhost: built from the actual origin the app is
          // running on (or VITE_SITE_URL if pinned) — see src/lib/siteUrl.ts.
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      })
      if (error) {
        devLog('signUp error', error)
        // Postgres raises a unique-violation from the profiles trigger if
        // the username was claimed by someone else between the last
        // availability check and this submit.
        if (/duplicate key|unique constraint/i.test(error.message)) {
          return { error: 'That username was just taken — try another.', code: 'username_taken' }
        }
        if (error.status === 429) {
          return { error: 'Too many sign-up attempts — please wait a bit and try again.', code: 'rate_limited' }
        }
        if (!error.status || error.status >= 500) {
          return { error: NETWORK_ERROR, code: 'network_error' }
        }
        return { error: error.message, code: error.code }
      }
      return { error: null }
    } catch (err) {
      devLog('signUp threw', err instanceof Error ? err : { message: String(err) })
      return { error: NETWORK_ERROR, code: 'network_error' }
    }
  }

  async function signIn(identifier: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    try {
      let email = identifier.trim()
      if (!email.includes('@')) {
        const { data, error: rpcError } = await supabase.rpc('email_for_username', {
          check_username: email,
        })
        if (rpcError) devLog('email_for_username RPC error', rpcError)
        if (rpcError || !data) {
          // Don't distinguish "no such username" from "wrong password" —
          // attempt the sign-in anyway with a value that can't match any
          // real account, so both cases return the exact same error.
          await supabase.auth.signInWithPassword({
            email: `${crypto.randomUUID()}@invalid.anywhere-path.local`,
            password,
          })
          return { error: GENERIC_LOGIN_ERROR, code: 'invalid_credentials' }
        }
        email = data
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return { error: null }
      return mapSignInError(error, email)
    } catch (err) {
      devLog('signIn threw', err instanceof Error ? err : { message: String(err) })
      return { error: NETWORK_ERROR, code: 'network_error' }
    }
  }

  async function resendConfirmationEmail(email: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
      })
      if (error) {
        devLog('resendConfirmationEmail error', error)
        if (error.status === 429) {
          return { error: 'Too many requests — please wait a bit before resending.', code: 'rate_limited' }
        }
        return { error: error.message, code: error.code }
      }
      return { error: null }
    } catch (err) {
      devLog('resendConfirmationEmail threw', err instanceof Error ? err : { message: String(err) })
      return { error: NETWORK_ERROR, code: 'network_error' }
    }
  }

  async function checkUsernameAvailable(candidate: string): Promise<boolean | null> {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('username_available', { check_username: candidate })
    if (error) {
      devLog('username_available RPC error', error)
      return null
    }
    return data ?? null
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function sendPasswordReset(email: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Never localhost — see src/lib/siteUrl.ts. This alone isn't
        // enough on its own: the resulting URL also has to be in the
        // Supabase project's Redirect URL allowlist (Dashboard ->
        // Authentication -> URL Configuration) or Supabase silently
        // ignores it and falls back to the Site URL instead.
        redirectTo: `${getSiteUrl()}/reset-password`,
      })
      if (error) {
        devLog('sendPasswordReset error', error)
        if (error.status === 429) {
          return { error: 'Too many requests — please wait a bit and try again.', code: 'rate_limited' }
        }
      }
      return { error: error?.message ?? null }
    } catch (err) {
      devLog('sendPasswordReset threw', err instanceof Error ? err : { message: String(err) })
      return { error: NETWORK_ERROR, code: 'network_error' }
    }
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) devLog('updatePassword error', error)
      return { error: error?.message ?? null }
    } catch (err) {
      devLog('updatePassword threw', err instanceof Error ? err : { message: String(err) })
      return { error: NETWORK_ERROR, code: 'network_error' }
    }
  }

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    username,
    loading,
    configured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
    checkUsernameAvailable,
    resendConfirmationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
