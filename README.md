# ethancarpenter.dev

Personal developer portfolio built as a cozy retro pixel-art cafe. Visitors can
(eventually) toss coffee beans into a grinder, grind enough for a pot, brew it,
and bump a shared global brew counter — without any of that gating the portfolio
content.

## Status

**Milestone 3 — Grinder, grounds & filter (current).** Every classified
`ThrowResult` from Milestone 2 now feeds a small **brew state machine**: a soft
Web-Audio chime, a restrained pixel shake on the grinder *art* (never the
collider), a ~0.9s grind cycle, then coffee grounds visibly falling into a
paper filter in a removable basket under the grinder. The multiplier decides
the fill (direct drop +1 … bank shot +4) against a single tunable
`groundsRequired`; rapid throws are batched through one grind timer with no
lost units. When the filter is full the grinder stops accepting (beans are
spat back out, not swallowed) and the basket becomes a plain drag target —
carry it to the coffee machine and it snaps into the slot; drop it short and
it glides home. The abstract grinder progress bar is gone; the grounds in the
filter are the progress indicator. No brewing, carafe fill, celebration,
global counter, or backend yet.

A bean only counts if its **swept path crosses the hopper's top entrance plane,
downward, within the mouth** (`hopperEntry.ts`, pure + unit-tested) — so a
fast bean can't tunnel past a thin sensor between physics steps, and a bean
fired at the *side* of the grinder bounces off the (now solid, longer) funnel
lips instead of scoring. The Matter sensor is kept only as a secondary trigger.
The held-bean tether also settles: while the pointer moves it stays long and
swingy, but a still pointer collapses the rest length so the bean rests **on**
the cursor, not below it (the held bean carries no gravity; normal weight
resumes on release).

Roadmap: ~~2) bean physics (Matter.js)~~ · ~~3) grinder / brew interaction~~ ·
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
    CafeScene.tsx     composes the six stacked layers, owns the brew state
    sceneConfig.ts    percentage anchors for every object (desktop + mobile)
    layers/           Background · Objects · Physics · Effects · SceneUI
    objects/          BeanBowl · Grinder · CoffeeMachine / Carafe (placeholder art)
    physics/          Matter.js: engine lifecycle, scene geometry, bean factory,
                      spring-tether grab (idle-settle) + safety maths, throw
                      tracker, swept top-entry gate (hopperEntry.ts, pure),
                      tuning config (physicsConfig.ts)
    scoring/          classifyThrow() — pure, deterministic, unit-tested
    brew/             the grind → fill → carry flow: brewMachine.ts (pure
                      reducer, unit-tested), useBrew.ts (timers + chime),
                      BrewLayer.tsx (filter basket + grounds + drag),
                      brewConfig.ts (every tunable), dragMath.ts (pure)
    audio/            createChimePlayer() + a subscribable mute preference
    debug/            dev-only physics tuning panel
  hooks/          useMediaQuery, useReducedMotion, useActiveSection
  content/        portfolio copy (single edit point; placeholder for now)
  styles/         tokens.css (palette / type / spacing / z-index) + global.css
```

### The cafe scene is layered, not one image

`<CafeScene>` stacks six full-size layers with `z-index` values from
`tokens.css`:

| Layer      | Contents                                    | Status      |
| ---------- | ------------------------------------------- | ----------- |
| Background | wall, window, shelves, lighting             | decorative  |
| Objects    | counter, bean bowl, grinder, machine, pot   | decorative  |
| Physics    | Matter.js bean toy on a `<canvas>`          | live        |
| Brew       | filter basket, grounds, dispense effect     | live        |
| Effects    | particles / steam / score popups            | empty       |
| Scene UI   | brew-counter slot, contextual hint          | live        |

Data flows one way: `CafePhysics` emits a classified `ThrowResult` → the brew
state machine consumes it → the layers render off that state. `CafePhysics`
knows nothing about grinding, sound, or the filter; its only new input is a
one-bit "can the grinder accept a bean right now" gate.

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
  swing only happens while you move the cursor; a still pointer settles it) —
  it stays playable, adds no automatic motion, and under reduced motion the
  tether damps harder and beans shed energy faster so nothing keeps swinging or
  rolling on its own.
- The bean `<canvas>` and the filter basket each set `touch-action: none` on
  themselves only, so a drag never scrolls the page while the page still
  scrolls normally everywhere else. The same flow works on touch and never
  relies on hover.
- Milestone 3 feedback is never sound-only: a successful bean also shakes the
  grinder, drops visible grounds, and grows the mound in the filter. The chime
  is Web Audio, created lazily inside the user's first toss (no autoplay),
  silently a no-op if audio can't start, rate-limited and voice-capped so a
  fast volley can't turn into noise, and it obeys a persisted mute preference.
- Reduced motion keeps every brew *outcome* (grounds update, fill level, full
  state) and only drops the animated shake / falling-grounds / pulse.
- The intro auto-collapses on the first bean grab (desktop overlay only, via
  the existing `autoCollapse()` — no focus change).
- Keyboard-operable nav with a disclosure menu on mobile (Esc to close),
  visible focus rings, 44px minimum touch targets on buttons.
