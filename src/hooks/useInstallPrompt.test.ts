import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInstallPrompt } from './useInstallPrompt'

function fireBeforeInstallPrompt(promptImpl: () => Promise<void>, outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: string }>
  }
  event.prompt = promptImpl
  event.userChoice = Promise.resolve({ outcome })
  window.dispatchEvent(event)
}

describe('useInstallPrompt', () => {
  it('starts with canInstall false — most browsers never fire the event (e.g. iOS Safari)', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it('flips canInstall true once the browser offers to install, and prevents the default mini-infobar', () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      fireBeforeInstallPrompt(() => Promise.resolve())
    })
    expect(result.current.canInstall).toBe(true)
  })

  it('promptInstall() calls the captured prompt() and clears canInstall afterward', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const prompt = vi.fn(() => Promise.resolve())
    act(() => {
      fireBeforeInstallPrompt(prompt)
    })
    await act(async () => {
      await result.current.promptInstall()
    })
    expect(prompt).toHaveBeenCalledOnce()
    expect(result.current.canInstall).toBe(false)
  })

  it('clears canInstall when the app gets installed through another path (e.g. the browser\'s own menu)', () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      fireBeforeInstallPrompt(() => Promise.resolve())
    })
    expect(result.current.canInstall).toBe(true)
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(result.current.canInstall).toBe(false)
  })
})
