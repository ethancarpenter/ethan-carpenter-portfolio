import type { ReactNode } from 'react'

import styles from './Section.module.css'

interface SectionProps {
  id: string
  eyebrow: string
  title: string
  lede?: string
  tone?: 'default' | 'alt'
  children: ReactNode
}

/** Shared section wrapper: a labelled landmark with a consistent heading block. */
export function Section({ id, eyebrow, title, lede, tone = 'default', children }: SectionProps) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      className={styles.section}
      data-tone={tone}
      aria-labelledby={headingId}
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {lede ? <p className={styles.lede}>{lede}</p> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
