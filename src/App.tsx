import { SiteFooter } from './components/SiteFooter.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { SkipLink } from './components/SkipLink.tsx'
import { Home } from './sections/Home.tsx'
import {
  About,
  Contact,
  Experience,
  Projects,
  Skills,
} from './sections/PortfolioSections.tsx'

export default function App() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <Home />
        <About />
        <Projects />
        <Experience />
        <Skills />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
