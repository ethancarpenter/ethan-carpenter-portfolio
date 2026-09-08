/** Portfolio content. Single edit point for the real thing: see README milestones. */

export interface NavItem {
  id: string
  label: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

export const IDENTITY = {
  name: 'Ethan Carpenter',
  domain: 'ethancarpenter.dev',
  role: 'Software Developer',
  tagline: 'I build software that turns complicated ideas into things people can actually use.',
  intro:
    'B.S. in Computer Science from UMass Amherst. I build full-stack projects, most notably a Dungeons & Dragons Campaign Manager application, and bring several years of professional leadership experience from managing teams at Target.',
  email: 'carpenter.ethan12@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ethan-carpenter/',
  // Left blank until you share the real link (the button only renders once
  // a value is set, see the Contact section). The projects aren't public yet.
  github: '',
  resumeHref: '/resume.pdf',
} as const

export const ABOUT_PARAGRAPHS: readonly string[] = [
  "I'm a software developer with a B.S. in Computer Science from the University of Massachusetts Amherst. Alongside the degree, I build full-stack projects end to end (schema and API design through the interface someone actually uses) because I like understanding a system all the way down.",
  "Before and during that degree, I spent several years in retail leadership at Target, most recently as a General Merchandise Executive Team Leader after being promoted through multiple Team Leader roles. That work is where I built habits I now bring to software: tracing problems to their root cause instead of their symptoms, making decisions from data instead of assumptions, owning a process end to end, and communicating clearly across people who don't share your context. As a Food & Beverage Team Leader, I helped drive our fulfillment 'item not found' rate from 4.2% down to 1.8% year-over-year by fixing inventory accuracy, backstock, and item-location reliability: the same root-cause, systems-level thinking I apply to code.",
  "Right now I'm actively building a Dungeons & Dragons Campaign Manager application and the Birthday Reminder App. This site is a project too: a pixel-art cafe where you can toss coffee beans into a grinder while you look around.",
]

export interface Project {
  name: string
  summary: string
  tags: readonly string[]
  status: string
  /** Concrete, currently-working functionality: only for projects with enough surface area to break down. */
  highlights?: readonly string[]
  /** Pulls the card out as the strongest showcase. At most one project should set this. */
  featured?: boolean
  github?: string
  demo?: string
}

export const PROJECTS: readonly Project[] = [
  {
    name: 'Dungeons & Dragons Campaign Manager',
    summary:
      'A full-stack campaign management application inspired by tabletop RPG campaign planning: track campaigns, cities, and quests, and map how quests connect to each other on an interactive graph.',
    tags: ['C#', 'ASP.NET Core', 'PostgreSQL', 'EF Core', 'React', 'Next.js', 'TypeScript'],
    status: 'In development',
    featured: true,
    highlights: [
      'Campaign, city, and quest management with REST APIs and ownership/authorization rules',
      'Interactive quest graph with persisted node positions',
      'Quest relationships, including progression dependencies, validated with cycle-detection graph traversal',
      'Automated backend and frontend testing',
    ],
  },
  {
    name: 'Birthday Reminder App',
    summary:
      "A React and TypeScript app for tracking birthdays and contact details and managing how you want to be reminded, built on Supabase with row-level security.",
    tags: ['React', 'TypeScript', 'Supabase', 'PostgreSQL'],
    status: 'In development',
    highlights: [
      'Account signup and login with protected routes',
      'User profiles with birthday and contact information',
      'Notification and contact preference settings',
    ],
  },
]

export interface ExperienceEntry {
  role: string
  org: string
  period: string
  detail: string
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    role: 'General Merchandise Executive Team Leader',
    org: 'Target, Westborough, MA',
    period: 'Present',
    detail:
      "Promoted internally after leading multiple teams, into ownership of General Merchandise operations for the store. I set priorities across a large team, diagnose operational problems, and coach other leaders through ambiguous, fast-changing situations.",
  },
  {
    role: 'Food & Beverage Team Leader',
    org: 'Target, Marlborough, MA',
    period: 'Previously',
    detail:
      "I'm energized by learning new approaches and applying them to improve how a team already works, and I find real satisfaction in seeing that translate into measurable results. As a Food & Beverage Team Leader, that meant driving our fulfillment 'item not found' rate from 4.2% down to 1.8% year-over-year by improving inventory accuracy, backstock processes, and item-location reliability. I also helped pilot a new F&B delivery process for the store and fed structured feedback back to headquarters on what worked and what didn't.",
  },
  {
    role: 'Service & Engagement Team Leader',
    org: 'Target, Marlborough, MA',
    period: 'Previously',
    detail:
      'Led front-of-store service and guest experience: training and coaching a team through high-variability, guest-facing situations and coordinating across departments to resolve problems in real time.',
  },
]

export interface SkillGroup {
  title: string
  items: readonly string[]
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  { title: 'Languages', items: ['C#', 'TypeScript', 'JavaScript', 'Java', 'Python', 'C++', 'C'] },
  { title: 'Frameworks & runtimes', items: ['React', 'ASP.NET Core / .NET', 'Node.js'] },
  { title: 'Data & backend', items: ['PostgreSQL', 'Supabase'] },
  { title: 'Tooling', items: ['Git / GitHub'] },
]
