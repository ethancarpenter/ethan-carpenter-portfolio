/**
 * A short, soft confirmation chime, synthesised with the Web Audio API so there
 * is no asset to ship. Played when a bean is accepted by the grinder.
 *
 * Constraints it respects:
 *  - never before a user gesture: the `AudioContext` is created lazily on the
 *    first `play()`, which only ever runs from a bean toss (a user action)
 *  - graceful: if Web Audio is missing or the context can't start, `play()`
 *    silently does nothing
 *  - no pile-up: a minimum gap between chimes and a hard voice cap keep rapid
 *    landings from turning into noise
 *  - obeys the global mute preference ({@link ./soundSettings})
 *
 * Sound is kept out of the brew state machine — the hook calls `play()`, that's
 * the whole coupling.
 */

import { getSoundPrefs, setSoundMuted, subscribeSound } from './soundSettings.ts'

export interface ChimePlayer {
  /** Play one chime if allowed (gap / voice cap / mute all checked here). */
  play: () => void
  /** Convenience passthrough to the global sound preference. */
  setMuted: (muted: boolean) => void
  /** Release the audio context and unsubscribe. Safe to call more than once. */
  dispose: () => void
}

export interface ChimeGateInput {
  muted: boolean
  /** `performance.now()` of the previous accepted play, or -Infinity. */
  lastPlayMs: number
  /** Chimes currently sounding. */
  voices: number
  now: number
}

export interface ChimeGateConfig {
  minGapMs: number
  maxVoices: number
}

export const CHIME_GATE: ChimeGateConfig = { minGapMs: 90, maxVoices: 3 }

/** Pure play/skip decision — unit-tested without any audio hardware. */
export function shouldPlayChime(input: ChimeGateInput, cfg: ChimeGateConfig = CHIME_GATE): boolean {
  if (input.muted) return false
  if (input.voices >= cfg.maxVoices) return false
  if (input.now - input.lastPlayMs < cfg.minGapMs) return false
  return true
}

/** C5-E5-G5: a gentle major arpeggio, quiet and quick. */
const NOTES = [523.25, 659.25, 783.99]

type AudioContextCtor = typeof AudioContext

function resolveAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as typeof window & { webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export function createChimePlayer(cfg: ChimeGateConfig = CHIME_GATE): ChimePlayer {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let lastPlayMs = Number.NEGATIVE_INFINITY
  let voices = 0
  let muted = getSoundPrefs().muted
  let disposed = false

  const unsubscribe = subscribeSound((p) => {
    muted = p.muted
  })

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx
    const Ctor = resolveAudioContextCtor()
    if (!Ctor) return null
    try {
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = 0.16
      master.connect(ctx.destination)
      return ctx
    } catch {
      ctx = null
      master = null
      return null
    }
  }

  function play(): void {
    if (disposed) return
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (!shouldPlayChime({ muted, lastPlayMs, voices, now }, cfg)) return

    const audio = ensureContext()
    if (!audio || !master) return

    try {
      if (audio.state === 'suspended') void audio.resume()
      lastPlayMs = now
      voices += 1

      const startedAt = audio.currentTime
      const detune = (Math.random() - 0.5) * 8
      let ended = 0

      for (let i = 0; i < NOTES.length; i += 1) {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.type = 'sine'
        osc.frequency.value = NOTES[i]
        osc.detune.value = detune

        const noteStart = startedAt + i * 0.045
        const noteDur = 0.5 - i * 0.08
        gain.gain.setValueAtTime(0.0001, noteStart)
        gain.gain.linearRampToValueAtTime(0.9, noteStart + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0008, noteStart + noteDur)

        osc.connect(gain)
        gain.connect(master)
        osc.start(noteStart)
        osc.stop(noteStart + noteDur + 0.03)
        osc.onended = () => {
          osc.disconnect()
          gain.disconnect()
          ended += 1
          if (ended >= NOTES.length) voices = Math.max(0, voices - 1)
        }
      }
    } catch {
      voices = Math.max(0, voices - 1)
    }
  }

  return {
    play,
    setMuted: setSoundMuted,
    dispose: () => {
      if (disposed) return
      disposed = true
      unsubscribe()
      try {
        void ctx?.close()
      } catch {
        /* already closed */
      }
      ctx = null
      master = null
    },
  }
}
