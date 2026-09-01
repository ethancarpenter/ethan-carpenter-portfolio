import styles from './layers.module.css'

interface LayerProps {
  className: string
}

/** Decorative back wall: window, shelves with jars/books/plant, pendant light. */
export function BackgroundLayer({ className }: LayerProps) {
  return (
    <div className={`${className} ${styles.background}`} aria-hidden="true">
      <div className={styles.pendant}>
        <div className={styles.pendantShade} />
        <div className={styles.pendantGlow} />
      </div>

      <div className={styles.window} />

      <div className={`${styles.shelf} ${styles.shelfTop}`} />
      <div className={`${styles.shelfItems} ${styles.shelfItemsTop}`}>
        <span className={styles.jar} />
        <span className={styles.jar} />
        <span className={styles.book} />
        <span className={styles.book} />
        <span className={styles.jar} />
      </div>

      <div className={`${styles.shelf} ${styles.shelfMid}`} />
      <div className={`${styles.shelfItems} ${styles.shelfItemsMid}`}>
        <span className={styles.book} />
        <span className={styles.book} />
        <span className={styles.book} />
        <span className={styles.jar} />
      </div>

      <div className={styles.plant}>
        <div className={styles.plantLeaves} />
        <div className={styles.plantPot} />
      </div>
    </div>
  )
}
