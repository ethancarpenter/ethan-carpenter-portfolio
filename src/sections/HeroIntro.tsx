import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { HeroIntroContext, HERO_OVERLAY_QUERY, useHeroIntro } from '../hooks/heroIntro.ts'
import type { HeroIntroControls } from '../hooks/heroIntro.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { IDENTITY } from '../content/portfolio.ts'
import styles from './HeroIntro.module.css'

/**
 * Owns the collapsed/expanded state of the hero intro and exposes it through
 * context. Wrap the hero (intro + cafe scene) so both the panel and, later,
 * the bean-physics layer can reach `collapse()`.
 */
export function HeroIntroProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const overlapsScene = useMediaQuery(HERO_OVERLAY_QUERY)

  const controls = useMemo<HeroIntroControls>(
    () => ({
      collapsed,
      overlapsScene,
      collapse: () => setCollapsed(true),
      expand: () => setCollapsed(false),
      autoCollapse: () => {
        if (overlapsScene) setCollapsed(true)
      },
    }),
    [collapsed, overlapsScene],
  )
  return <HeroIntroContext.Provider value={controls}>{children}</HeroIntroContext.Provider>
}

/**
 * The professional introduction that layers over the pixel cafe. Full panel on
 * load; collapses to a small identity chip so the bean-to-grinder play area is
 * fully exposed. The name stays the page's single <h1> in both states.
 */
export function HeroIntro() {
  const { collapsed, collapse, expand } = useHeroIntro()
  const panelId = useId()

  const collapseButtonRef = useRef<HTMLButtonElement>(null)
  const expandButtonRef = useRef<HTMLButtonElement>(null)
  // Only a user click sets this; a programmatic collapse() leaves focus alone.
  const focusTarget = useRef<'collapse' | 'expand' | null>(null)

  useEffect(() => {
    if (focusTarget.current === 'expand' && collapsed) {
      expandButtonRef.current?.focus()
    } else if (focusTarget.current === 'collapse' && !collapsed) {
      collapseButtonRef.current?.focus()
    }
    focusTarget.current = null
  }, [collapsed])

  const handleCollapse = () => {
    focusTarget.current = 'expand'
    collapse()
  }

  const handleExpand = () => {
    focusTarget.current = 'collapse'
    expand()
  }

  if (collapsed) {
    return (
      <div className={styles.slot} data-state="collapsed">
        <div className={styles.chip}>
          <div className={styles.chipText}>
            <h1 id="home-heading" className={styles.chipName}>
              {IDENTITY.name}
            </h1>
            <span className={styles.chipRole}>{IDENTITY.role}</span>
          </div>
          <button
            type="button"
            ref={expandButtonRef}
            className={styles.iconButton}
            onClick={handleExpand}
            aria-expanded={false}
            title="Expand introduction"
          >
            <span aria-hidden="true">+</span>
            <span className="sr-only">Expand introduction</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.slot} data-state="expanded">
      <div id={panelId} className={styles.panel}>
        <button
          type="button"
          ref={collapseButtonRef}
          className={`${styles.iconButton} ${styles.collapseButton}`}
          onClick={handleCollapse}
          aria-expanded={true}
          aria-controls={panelId}
          title="Collapse introduction"
        >
          <span aria-hidden="true">&minus;</span>
          <span className="sr-only">Collapse introduction</span>
        </button>

        <p className={styles.eyebrow}>
          {IDENTITY.role} &middot; {IDENTITY.domain}
        </p>
        <h1 id="home-heading" className={styles.name}>
          {IDENTITY.name}
        </h1>
        <p className={styles.tagline}>{IDENTITY.tagline}</p>
        <p className={styles.blurb}>{IDENTITY.intro}</p>

        <div className={styles.actions}>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="#projects">
            See the work
          </a>
          <a className={`${styles.btn} ${styles.btnSecondary}`} href="#about">
            About me
          </a>
        </div>
      </div>
    </div>
  )
}
