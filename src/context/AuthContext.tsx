import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export interface AuthResult {
  error: string | null
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
}

const GENERIC_LOGIN_ERROR = 'Invalid email/username or password.'

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      // Postgres raises a unique-violation from the profiles trigger if the
      // username was claimed by someone else between the last availability
      // check and this submit — surface that as a friendly message instead
      // of the raw constraint error.
      if (/duplicate key|unique constraint/i.test(error.message)) {
        return { error: 'That username was just taken — try another.' }
      }
      return { error: error.message }
    }
    return { error: null }
  }

  async function signIn(identifier: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }

    let email = identifier.trim()
    if (!email.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('email_for_username', {
        check_username: email,
      })
      if (rpcError || !data) {
        // Don't distinguish "no such username" from "wrong password" — the
        // login attempt still takes the same amount of time either way,
        // and returns the exact same generic error.
        await supabase.auth.signInWithPassword({
          email: `${crypto.randomUUID()}@invalid.anywhere-path.local`,
          password,
        })
        return { error: GENERIC_LOGIN_ERROR }
      }
      email = data
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? GENERIC_LOGIN_ERROR : null }
  }

  async function checkUsernameAvailable(candidate: string): Promise<boolean | null> {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('username_available', { check_username: candidate })
    if (error) return null
    return data ?? null
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function sendPasswordReset(email: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
