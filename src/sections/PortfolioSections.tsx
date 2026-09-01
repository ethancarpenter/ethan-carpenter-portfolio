import {
  ABOUT_PARAGRAPHS,
  EXPERIENCE,
  IDENTITY,
  PROJECTS,
  SKILL_GROUPS,
} from '../content/portfolio.ts'
import { Section } from './Section.tsx'
import styles from './Section.module.css'

/** The About, Projects, Experience, Skills, and Contact sections. */

export function About() {
  return (
    <Section
      id="about"
      eyebrow="Pull up a chair"
      title="About"
      lede="Placeholder bio for now."
      tone="alt"
    >
      <div className={styles.prose}>
        {ABOUT_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </Section>
  )
}

export function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="On the menu"
      title="Projects"
      lede="A few things I've built. Placeholder entries for now."
    >
      <div className={styles.grid}>
        {PROJECTS.map((project) => (
          <article key={project.name} className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h3 className={styles.cardTitle}>{project.name}</h3>
              <span className={styles.badge}>{project.status}</span>
            </div>
            <p>{project.summary}</p>
            <ul className={styles.tags}>
              {project.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className={styles.placeholderNote}>
        Real projects, source links, and live demos coming soon.
      </p>
    </Section>
  )
}

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="The back room"
      title="Experience"
      lede="Placeholder timeline."
      tone="alt"
    >
      <div className={styles.timeline}>
        {EXPERIENCE.map((entry) => (
          <div key={`${entry.org}-${entry.period}`} className={styles.timelineItem}>
            <h3 className={styles.cardTitle}>
              {entry.role} &mdash; {entry.org}
            </h3>
            <p className={styles.timelineMeta}>{entry.period}</p>
            <p>{entry.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="House blend"
      title="Skills"
      lede="Tools I reach for most."
    >
      <div className={styles.grid}>
        {SKILL_GROUPS.map((group) => (
          <div key={group.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{group.title}</h3>
            <ul className={styles.tags}>
              {group.items.map((item) => (
                <li key={item} className={styles.tag}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function Contact() {
  return (
    <Section
      id="contact"
      eyebrow="Last call"
      title="Contact"
      lede="The best way to reach me while the site is being built."
      tone="alt"
    >
      <div className={styles.prose}>
        <p>
          Email:{' '}
          <a href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}</a>
        </p>
        <p className={styles.placeholderNote}>
          A proper contact form and social links coming soon.
        </p>
      </div>
    </Section>
  )
}
