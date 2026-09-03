import { useState } from 'react'

import type { PhysicsDebugState } from '../physics/types.ts'
import styles from './PhysicsDebugPanel.module.css'

interface PhysicsDebugPanelProps {
  state: PhysicsDebugState
  onToggleColliders: (on: boolean) => void
}

/**
 * Development-only tuning readout. Rendered by <PhysicsLayer> behind an
 * `import.meta.env.DEV` check, fixed to the viewport corner so it never covers
 * the bean-to-grinder play area. Not production UI.
 */
export function PhysicsDebugPanel({ state, onToggleColliders }: PhysicsDebugPanelProps) {
  const [open, setOpen] = useState(true)
  const [colliders, setColliders] = useState(false)
  const t = state.lastThrow?.telemetry

  return (
    <aside className={styles.panel} aria-hidden="true">
      <div className={styles.header}>
        <span>physics debug · dev</span>
        <button type="button" className={styles.toggle} onClick={() => setOpen((v) => !v)}>
          {open ? '–' : '+'}
        </button>
      </div>

      {open && (
        <div className={styles.body}>
          <Row label="active beans" value={String(state.activeBeanCount)} />
          <Row label="tether active" value={state.dragging ? 'yes' : 'no'} />
          <hr className={styles.rule} />
          <div className={styles.section}>grab / swing (live)</div>
          <Row label="bean speed" value={`${state.heldBeanSpeed.toFixed(0)} px/s`} />
          <Row
            label="bean vel x,y"
            value={`${state.heldBeanVelocity.x.toFixed(0)}, ${state.heldBeanVelocity.y.toFixed(0)}`}
          />
          <Row label="pointer speed" value={`${state.pointerSpeed.toFixed(0)} px/s`} />
          <Row label="tether mode" value={state.pointerIdle ? 'idle (settling)' : 'moving'} />
          <Row label="bean↔anchor" value={`${state.beanAnchorDistance.toFixed(0)} px`} />
          <Row label="tether len" value={state.tether.length.toFixed(1)} />
          <Row label="stiffness" value={state.tether.stiffness.toFixed(3)} />
          <Row label="damping" value={state.tether.damping.toFixed(3)} />
          <hr className={styles.rule} />
          {state.lastThrow && t ? (
            <>
              <Row
                label="last throw"
                value={`${state.lastThrow.label} (${state.lastThrow.multiplier}x)`}
              />
              <Row label="release speed" value={`${t.releaseSpeed.toFixed(0)} px/s`} />
              <Row
                label="release vel"
                value={`${t.releaseVelocity.x.toFixed(0)}, ${t.releaseVelocity.y.toFixed(0)}`}
              />
              <Row
                label="pointer vel"
                value={`${t.pointerReleaseVelocity.x.toFixed(0)}, ${t.pointerReleaseVelocity.y.toFixed(0)}`}
              />
              <Row label="travel" value={`${t.postReleaseTravel.toFixed(0)} px`} />
              <Row label="airtime" value={`${t.airtimeMs.toFixed(0)} ms`} />
              <Row label="bounces" value={String(t.bounceCount)} />
              <Row label="entry speed" value={`${t.entrySpeed.toFixed(0)} px/s`} />
              <Row label="direct drop" value={t.releasedBeforeGrinder ? 'no' : 'yes'} />
            </>
          ) : (
            <p className={styles.empty}>No throws yet.</p>
          )}
          <hr className={styles.rule} />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={colliders}
              onChange={(e) => {
                setColliders(e.target.checked)
                onToggleColliders(e.target.checked)
              }}
            />
            show colliders
          </label>
        </div>
      )}
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}
