import webpush from 'web-push'

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}

/** True if the push service rejected the subscription as gone (device unsubscribed, or the subscription expired) — the caller should delete the row. */
export function isSubscriptionGone(err: unknown): boolean {
  const statusCode = (err as { statusCode?: number } | null)?.statusCode
  return statusCode === 404 || statusCode === 410
}

/** Thin wrapper so the caller never touches the `web-push` SDK or VAPID details directly. */
export async function sendPush(
  subscription: PushSubscriptionRow,
  payload: PushPayload,
  vapid: VapidConfig
): Promise<void> {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload)
  )
}
