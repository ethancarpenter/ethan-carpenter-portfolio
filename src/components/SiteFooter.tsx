import { IDENTITY } from '../content/portfolio.ts'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          &copy; {new Date().getFullYear()} {IDENTITY.name}
        </span>
        <span className={styles.note}>{IDENTITY.domain}</span>
      </div>
    </footer>
  )
}
