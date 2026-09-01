import { useEffect, useId, useState } from 'react'

import { useActiveSection } from '../hooks/useActiveSection.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { IDENTITY, NAV_ITEMS } from '../content/portfolio.ts'
import styles from './SiteHeader.module.css'

const SECTION_IDS = NAV_ITEMS.map((item) => item.id)

/**
 * Sticky top navigation. Plain anchor links, so portfolio content is reachable
 * whether or not the cafe scene loads. Collapses to a disclosure menu under 720px.
 */
export function SiteHeader() {
  const isMobile = useMediaQuery('(max-width: 720px)')
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)
  const menuId = useId()

  // Reset the menu when the layout leaves the mobile breakpoint.
  useEffect(() => {
    if (!isMobile) setOpen(false)
  }, [isMobile])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const navVisible = !isMobile || open

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#home" onClick={() => setOpen(false)}>
          <span className={styles.brandMark} aria-hidden="true" />
          {IDENTITY.domain}
        </a>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <nav
          id={menuId}
          className={`${styles.nav} ${navVisible ? styles.navOpen : ''}`}
          aria-label="Primary"
          hidden={isMobile && !open}
        >
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  className={`${styles.navLink} ${
                    active === item.id ? styles.navLinkActive : ''
                  }`}
                  href={`#${item.id}`}
                  aria-current={active === item.id ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
