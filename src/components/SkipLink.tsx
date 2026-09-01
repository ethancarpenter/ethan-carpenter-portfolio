import styles from './SkipLink.module.css'

/** Lets keyboard users jump straight to page content, past the nav. */
export function SkipLink() {
  return (
    <a className={styles.skipLink} href="#main">
      Skip to content
    </a>
  )
}
