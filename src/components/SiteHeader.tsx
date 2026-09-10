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

          {IDENTITY.github ? (
            <a
              className={styles.githubLink}
              href={IDENTITY.github}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              <svg
                className={styles.githubIcon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
              GitHub
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
