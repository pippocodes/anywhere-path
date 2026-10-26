import '@testing-library/jest-dom'

// Recent Node (22+) claims the `localStorage` global itself (gated behind
// --localstorage-file), which shadows jsdom's own window.localStorage and
// leaves it `undefined` in tests even though real browsers never hit this.
// A small in-memory polyfill keeps any code that reads window.localStorage
// working the same way in tests as it does in the browser.
if (typeof window !== 'undefined' && !window.localStorage) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>()
    get length() {
      return this.store.size
    }
    clear(): void {
      this.store.clear()
    }
    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null
    }
    key(index: number): string | null {
      return Array.from(this.store.keys())[index] ?? null
    }
    removeItem(key: string): void {
      this.store.delete(key)
    }
    setItem(key: string, value: string): void {
      this.store.set(key, String(value))
    }
  }
  Object.defineProperty(window, 'localStorage', { value: new MemoryStorage(), configurable: true })
}

// jsdom doesn't implement matchMedia at all. Components that branch on
// viewport width (useIsPhone, ThemeContext's prefers-color-scheme check)
// call it unconditionally, so tests need at least a no-op stand-in —
// defaults to "doesn't match" (desktop), same as every test's existing
// expectations before any such component called it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
