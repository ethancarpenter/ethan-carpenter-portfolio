# ethancarpenter.dev

Personal developer portfolio built as a cozy retro pixel-art cafe. Visitors can
(eventually) toss coffee beans into a grinder, grind enough for a pot, brew it,
and bump a shared global brew counter — without any of that gating the portfolio
content.

## Status

**Milestone 2 — Bean physics (current).** Real Matter.js bean toy on the
Physics layer: grab a bean from the bowl on a short **spring tether** (the
cursor is a magnetic anchor, the bean lags and swings around it), circle to
build momentum, and fling it — the bean keeps its own accumulated velocity on
release. Misses bounce/roll on the counter; a slow drag straight into the
hopper still counts as a direct drop. Successful throws are classified (direct
drop / nice toss / great shot / bank shot) by a pure scoring function and
reported through a callback — nothing is wired to grinder progress yet.
Dev-only debug panel for tuning. No grinder animation, grounds, brewing,
counter, or backend.

Roadmap: ~~2) bean physics (Matter.js)~~ · 3) grinder / brew interaction ·
4) real portfolio content · 5) global brew counter (Cloudflare) · 6) polish ·
7) launch.

## Stack

- **React 19 + TypeScript**, **Vite 6**, **CSS Modules**
- **Matter.js 0.20** (`@types/matter-js` dev-only) — the bean physics engine,
  instantiated only for the cafe scene
- **oxlint** for linting; **`node:test` + `tsx`** for unit tests
  (`npm test` → `scripts/test.mjs` runs every `src/**/*.test.ts`). Vitest was
  avoided: v2 ships an old bundled Vite/esbuild with advisories, v3+ needs
  Node > 20.18.
- Pinned to Vite 6 / TS 5.7 because the current `create-vite` output requires
  Node ≥ 20.19; this repo targets Node 20.18+.

No other runtime dependencies.

## Commands

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # tsc project build + vite production build
npm run preview    # serve the production build locally
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm test           # node:test + tsx over src/**/*.test.ts
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
    physics/          Matter.js: engine lifecycle, scene geometry, bean factory,
                      spring-tether grab + safety maths, throw tracker,
                      tuning config (physicsConfig.ts)
    scoring/          classifyThrow() — pure, deterministic, unit-tested
    debug/            dev-only physics tuning panel
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
| Physics    | Matter.js bean toy on a `<canvas>`         | live        |
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
- The whole cafe scene is decorative (`role="img"` + `aria-hidden` sub-layers),
  the bean toy included; nothing needed to use the site lives inside it. The
  bean interaction is pointer/touch only in this milestone — a keyboard/AT
  "drop a bean in" affordance is a candidate for a later milestone (the
  controller already exposes a clean throw-result callback to build on).
- `prefers-reduced-motion` disables transitions, smooth scroll, and the hint
  animation; the demo-bean wiggle is gone. The bean toy is user-driven (the
  swing only happens while you move the cursor) — it stays playable, adds no
  automatic motion, and under reduced motion the tether damps harder and beans
  shed energy faster so nothing keeps swinging or rolling on its own.
- The bean `<canvas>` sets `touch-action: none` on itself only, so a drag never
  scrolls the page while the page still scrolls normally everywhere else.
- The intro auto-collapses on the first bean grab (desktop overlay only, via
  the existing `autoCollapse()` — no focus change).
- Keyboard-operable nav with a disclosure menu on mobile (Esc to close),
  visible focus rings, 44px minimum touch targets on buttons.
