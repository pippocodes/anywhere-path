import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface UseInstallPromptResult {
  // True only once the browser has actually offered to install this app
  // (Chrome/Edge/Android) — there's no such signal on iOS Safari, so the
  // "Install app" button simply never appears there; see the Settings page
  // for the manual Add to Home Screen steps shown instead.
  canInstall: boolean
  promptInstall: () => Promise<void>
}

/** Captures the browser's `beforeinstallprompt` event so a real UI button can trigger it later — the event fires once, early, and is gone if not saved. */
export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
    }
    function handleAppInstalled() {
      setDeferredEvent(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    await deferredEvent.userChoice
    setDeferredEvent(null)
  }, [deferredEvent])

  return { canInstall: deferredEvent !== null, promptInstall }
}
