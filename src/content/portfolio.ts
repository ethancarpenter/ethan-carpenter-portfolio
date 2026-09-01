/** Portfolio content. Placeholder copy for now; single edit point for the real thing. */

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
  role: 'Software developer',
  tagline: 'I build interactive web experiences — and the occasional playable coffee machine.',
  intro:
    'Full-stack developer focused on TypeScript and React. I like turning ordinary interfaces into small, memorable things you actually want to touch.',
  // Placeholder — swap in a real address or contact form.
  email: 'hello@ethancarpenter.dev',
  location: 'Remote / United States',
} as const

export const ABOUT_PARAGRAPHS: readonly string[] = [
  'Placeholder bio. I care about the feel of software: motion, feedback, and the small details that make an interface feel alive without getting in the way.',
  'I work mainly in the TypeScript ecosystem — React on the front end, Node and edge functions on the back — and enjoy the parts of a project where design and engineering overlap.',
  'This site is a work in progress: a pixel-art cafe you can play with.',
]

export interface Project {
  name: string
  summary: string
  tags: readonly string[]
  status: string
}

export const PROJECTS: readonly Project[] = [
  {
    name: 'Pixel Cafe Portfolio',
    summary:
      'This site. A layered pixel-art cafe with bean-tossing physics and a shared global brew counter.',
    tags: ['React', 'TypeScript', 'Matter.js', 'Cloudflare'],
    status: 'In progress',
  },
  {
    name: 'Project Two',
    summary: 'Placeholder. A short description of a real project goes here.',
    tags: ['TypeScript', 'Node'],
    status: 'Placeholder',
  },
  {
    name: 'Project Three',
    summary: 'Placeholder. Another project summary with a link to source and a live demo.',
    tags: ['React', 'CSS'],
    status: 'Placeholder',
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
    role: 'Software Developer',
    org: 'Placeholder Company',
    period: '20XX — Present',
    detail: 'Placeholder responsibilities and impact.',
  },
  {
    role: 'Developer',
    org: 'Earlier Placeholder Role',
    period: '20XX — 20XX',
    detail: 'Placeholder. Shipped features, fixed bugs, drank coffee.',
  },
]

export interface SkillGroup {
  title: string
  items: readonly string[]
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  { title: 'Languages', items: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'SQL'] },
  { title: 'Frontend', items: ['React', 'Vite', 'CSS Modules', 'Web Animations', 'Canvas'] },
  { title: 'Backend & infra', items: ['Node.js', 'Cloudflare Workers', 'D1 / SQLite', 'REST'] },
  { title: 'Practice', items: ['Accessibility', 'Performance', 'Testing', 'Git'] },
]
