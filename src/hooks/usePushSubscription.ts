import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { savePushSubscription, deletePushSubscription, sendTestNotification } from '../lib/notificationsApi'

/** Converts a VAPID public key (base64url, no padding — the format `web-push`'s generate-vapid-keys prints) into the Uint8Array PushManager.subscribe() requires as applicationServerKey. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export interface UsePushSubscriptionResult {
  // False when the browser has no PushManager at all (e.g. iOS Safari in a
  // regular tab, before the app is added to the Home Screen).
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
  loading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  sendTest: () => Promise<{ sent: number; failed: number }>
}

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function usePushSubscription(): UsePushSubscriptionResult {
  const { session } = useAuth()
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    supported ? Notification.permission : 'unsupported'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setSubscribed(sub !== null)
      })
      .catch(() => {
        /* no registered service worker yet — treat as not subscribed */
      })
    return () => {
      cancelled = true
    }
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!supported || !vapidPublicKey) {
      setError('Push notifications are not available on this device.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== 'granted') {
        setError('Notifications were not allowed — you can turn this on later from your browser settings.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }))
      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('The browser did not return a usable subscription.')
      }
      await savePushSubscription(session?.access_token, {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      })
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn on push reminders — try again.')
    } finally {
      setLoading(false)
    }
  }, [supported, session?.access_token])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await deletePushSubscription(session?.access_token, sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn off push reminders — try again.')
    } finally {
      setLoading(false)
    }
  }, [supported, session?.access_token])

  const sendTest = useCallback(() => sendTestNotification(session?.access_token), [session?.access_token])

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe, sendTest }
}
