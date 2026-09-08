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
      lede="Computer science degree, professional leadership experience, and real projects built end to end."
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
      lede="A few things I've built: the Dungeons & Dragons Campaign Manager is the main course."
    >
      <div className={styles.grid}>
        {PROJECTS.map((project) => (
          <article
            key={project.name}
            className={`${styles.card} ${project.featured ? styles.cardFeatured : ''}`}
          >
            <div className={styles.cardTitleRow}>
              <h3 className={styles.cardTitle}>{project.name}</h3>
              <div className={styles.badgeGroup}>
                {project.featured ? (
                  <span className={`${styles.badge} ${styles.badgeFeatured}`}>Flagship</span>
                ) : null}
                <span className={styles.badge}>{project.status}</span>
              </div>
            </div>
            <p>{project.summary}</p>
            {project.highlights ? (
              <ul className={styles.highlights}>
                {project.highlights.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
            <ul className={styles.tags}>
              {project.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
            {project.github || project.demo ? (
              <div className={styles.linkRow}>
                {project.github ? (
                  <a
                    className={styles.linkButton}
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source
                  </a>
                ) : null}
                {project.demo ? (
                  <a
                    className={styles.linkButton}
                    href={project.demo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live demo
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  )
}

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="The back room"
      title="Experience"
      lede="Years of professional leadership, alongside the CS degree."
      tone="alt"
    >
      <div className={styles.timeline}>
        {EXPERIENCE.map((entry) => (
          <div key={entry.role} className={styles.timelineItem}>
            <h3 className={styles.cardTitle}>
              {entry.role} at {entry.org}
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
      lede="Languages and tools I actually use, in the projects above."
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
  const hasLinks = IDENTITY.linkedin || IDENTITY.github || IDENTITY.resumeHref

  return (
    <Section
      id="contact"
      eyebrow="Last call"
      title="Contact"
      lede="The best way to reach me."
      tone="alt"
    >
      <div className={styles.prose}>
        <p>
          Email: <a href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}</a>
        </p>
        {hasLinks ? (
          <div className={styles.linkRow}>
            {IDENTITY.linkedin ? (
              <a
                className={styles.linkButton}
                href={IDENTITY.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            ) : null}
            {IDENTITY.github ? (
              <a
                className={styles.linkButton}
                href={IDENTITY.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            ) : null}
            {IDENTITY.resumeHref ? (
              <a
                className={styles.linkButton}
                href={IDENTITY.resumeHref}
                target="_blank"
                rel="noreferrer"
              >
                Resume
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </Section>
  )
}
