/**
 * Tiny global sound-preference store. One flag today (`muted`), but structured
 * as a subscribable store with persistence so a settings toggle or extra
 * channels can be added later without touching the chime player.
 *
 * Deliberately framework-free — components read it through a hook or effect.
 * Storage access is wrapped: private-mode / disabled-storage browsers fall back
 * to an in-memory default and never throw.
 */

export interface SoundPrefs {
  muted: boolean
}

type Listener = (prefs: SoundPrefs) => void

const STORAGE_KEY = 'cafe.sound'
const listeners = new Set<Listener>()

let prefs: SoundPrefs = load()

function load(): SoundPrefs {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SoundPrefs>
      return { muted: parsed.muted === true }
    }
  } catch {
    /* storage unavailable — use the default */
  }
  return { muted: false }
}

function persist(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* storage unavailable — keep the in-memory value */
  }
}

export function getSoundPrefs(): SoundPrefs {
  return prefs
}

export function setSoundMuted(muted: boolean): void {
  if (prefs.muted === muted) return
  prefs = { ...prefs, muted }
  persist()
  for (const listener of listeners) listener(prefs)
}

/** Subscribe to preference changes. Returns an unsubscribe function. */
export function subscribeSound(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
