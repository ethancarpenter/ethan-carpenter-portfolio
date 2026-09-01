import { CafeScene } from '../game/CafeScene.tsx'
import { HeroIntro, HeroIntroProvider } from './HeroIntro.tsx'
import styles from './Home.module.css'

/**
 * Landing section. The intro panel and nav carry everything a visitor needs;
 * the cafe scene can be ignored without losing access to the portfolio, and
 * the intro collapses out of the way when someone wants to play.
 */
export function Home() {
  return (
    <section id="home" className={styles.home} aria-labelledby="home-heading">
      <div className={styles.container}>
        <HeroIntroProvider>
          <div className={styles.hero}>
            <div className={styles.sceneWrap}>
              <CafeScene />
              <p className={styles.sceneCaption}>
                A pixel-art cafe in progress. Soon you&rsquo;ll be able to toss coffee beans
                into the grinder and brew a pot &mdash; but it will never get in the way of
                the portfolio.
              </p>
            </div>
            <HeroIntro />
          </div>
        </HeroIntroProvider>
      </div>
    </section>
  )
}
