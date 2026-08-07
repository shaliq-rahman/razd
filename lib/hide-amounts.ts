'use client'

/**
 * The "hide amounts" preference, kept in localStorage so it survives reloads.
 *
 * Exposed as an external store rather than an effect that sets state: the value
 * does not exist during server rendering, and useSyncExternalStore lets the
 * server snapshot be `false` while the client reads the real value on hydration,
 * with no mismatch and no setState-in-effect.
 */
const KEY = 'razd:hide-amounts'

const listeners = new Set<() => void>()

export function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  // Keep other tabs in step.
  window.addEventListener('storage', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

export function getSnapshot(): boolean {
  return localStorage.getItem(KEY) === '1'
}

/** Amounts are always visible in server-rendered HTML. */
export function getServerSnapshot(): boolean {
  return false
}

export function setHideAmounts(hidden: boolean): void {
  localStorage.setItem(KEY, hidden ? '1' : '0')
  listeners.forEach((l) => l())
}
