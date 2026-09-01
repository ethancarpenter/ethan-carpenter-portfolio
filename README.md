# ethancarpenter.dev

Personal developer portfolio built as a cozy retro pixel-art cafe. Visitors can
(eventually) toss coffee beans into a grinder, grind enough for a pot, brew it,
and bump a shared global brew counter — without any of that gating the portfolio
content.

## Status

**Milestone 1 — Foundation (current).** Project setup, responsive site shell,
placeholder portfolio sections, and the layered cafe-scene architecture with CSS
placeholder art. No physics, no backend yet.

Roadmap: 2) bean physics (Matter.js) · 3) grinder / brew interaction ·
4) real portfolio content · 5) global brew counter (Cloudflare) · 6) polish ·
7) launch.

## Stack

- **React 19 + TypeScript**, **Vite 6**, **CSS Modules**
- **oxlint** for linting
- Pinned to Vite 6 / TS 5.7 because the current `create-vite` output requires
  Node ≥ 20.19; this repo targets Node 20.18+.

No other runtime dependencies. Matter.js is added in Milestone 2.

## Commands

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # tsc project build + vite production build
npm run preview    # serve the production build locally
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
```

## Architecture

```
src/
  components/     site shell — header/nav, footer, skip link
  sections/       portfolio sections (Home + About/Projects/Experience/Skills/Contact)
  game/           the interactive cafe scene
    CafeScene.tsx     composes the five stacked layers
    sceneConfig.ts    percentage anchors for every object (desktop + mobile)
    layers/           Background · Objects · Physics · Effects · SceneUI
    objects/          BeanBowl · Grinder · CoffeeMachine / Carafe (placeholder art)
  hooks/          useMediaQuery, useReducedMotion, useActiveSection
  content/        portfolio copy (single edit point; placeholder for now)
  styles/         tokens.css (palette / type / spacing / z-index) + global.css
```

### The cafe scene is layered, not one image

`<CafeScene>` stacks five full-size layers with `z-index` values from
`tokens.css`:

| Layer      | Contents                                   | Status      |
| ---------- | ------------------------------------------ | ----------- |
| Background | wall, window, shelves, lighting            | decorative  |
| Objects    | counter, bean bowl, grinder, machine, pot  | decorative  |
| Physics    | Matter.js canvas mount point               | empty       |
| Effects    | particles / steam / score popups           | empty       |
| Scene UI   | grinder progress, brew-counter slot, hint  | live        |

Every object's position comes from `sceneConfig.ts` as a percentage anchor, with
separate `desktop` and `mobile` layouts. Both the CSS art and the physics bodies
read from that same config, so the visual scene and the physics world stay
aligned. Pixel-art PNGs replace the CSS placeholders one element at a time —
nothing here is a flattened background.

## Accessibility

- Skip link, semantic landmarks (`header`/`nav`/`main`/`footer`), one `<h1>`,
  section `<h2>`s with `aria-labelledby`.
- The whole cafe scene is decorative (`role="img"` + `aria-hidden` sub-layers);
  nothing needed to use the site lives inside it.
- `prefers-reduced-motion` disables transitions, smooth scroll, and the
  bean / hint animations.
- Keyboard-operable nav with a disclosure menu on mobile (Esc to close),
  visible focus rings, 44px minimum touch targets on buttons.
