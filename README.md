# ethancarpenter.dev

Personal developer portfolio built as a cozy retro pixel-art cafe. Visitors can
toss coffee beans into a grinder, grind enough for a pot, and brew it to bump a
real, shared global brew counter, none of which gates the portfolio content.

## Status

**Milestone 6 — Final polish (current).** A refinement pass across the whole
site: responsive/touch-target fixes (nav links and the hero panel's collapse
button were under the 44px minimum tap target; both fixed), a real WCAG
contrast fix (the terracotta accent/link-hover color was ~3:1 on cream, below
the 4.5:1 AA minimum for text — see `--c-terracotta-deep` in `tokens.css`),
metadata improvements (title/description now actually describe the site,
added `twitter:card` + canonical link), and the Resume button is now wired up
(`public/resume.pdf` existed but `IDENTITY.resumeHref` was still blank). Also
removed one piece of genuinely dead content (`IDENTITY.location`, defined but
never rendered anywhere). Animations, error/loading states, and content
accuracy were audited and found already solid from prior milestones — nothing
needed changing there. Bean physics and the counter architecture are
untouched. See the end of this file for the full polish summary and the
Milestone 7 deployment-readiness checklist.

**Milestone 5 — Global brew counter.** A real Cloudflare backend: a
Worker at `worker/` (D1-backed `GET`/`POST /api/brews`) behind the existing
brew flow. Completing the existing sequence (drag a full filter basket into
the coffee machine slot: `stage === 'installed'`) reports exactly one
completed pot to the server, which atomically increments a `site_stats` row
and returns the new authoritative total; the client never sends or invents a
count. The in-scene HUD badge (top-right of the cafe scene, previously a
`———` placeholder) now shows the real, shared total, formatted with commas,
and degrades quietly (dims, keeps the last known value) if the API is
unreachable — the game is never blocked by it. See **Brew counter backend**
below for the full architecture, local dev setup, and the one Cloudflare
account step this milestone can't do on its own (creating the real D1
database). Bean physics, scoring, and the coffee scene layout are untouched
this milestone.

**Milestone 4 — Real portfolio content.** The `src/content/portfolio.ts`
single edit point now carries Ethan's actual bio, Target leadership experience,
and real projects in place of the placeholder copy: the **Dungeons & Dragons
Campaign Manager** (the flagship project, formerly referred to internally as
"Big If True": that name is no longer used anywhere public-facing) and the
**Birthday Reminder App**, still in development. The Ethics Scenario Simulator
and MBR/GPT Parser projects were dropped from the public site. LinkedIn is
live (`IDENTITY.linkedin`); GitHub and a resume file are still blank until a
real link/asset is provided (the projects aren't public yet), and those
buttons only render once `IDENTITY.github` / `.resumeHref` are set. The
coffee game itself is untouched beyond an earlier physics/scoring tuning pass.

**Milestone 3 — Grinder, grounds & filter.** Every classified
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
~~4) real portfolio content~~ · ~~5) global brew counter (Cloudflare)~~ ·
~~6) polish~~ · 7) launch.

## Stack

- **React 19 + TypeScript**, **Vite 6**, **CSS Modules**
- **Matter.js 0.20** (`@types/matter-js` dev-only) — the bean physics engine,
  instantiated only for the cafe scene
- **oxlint** for linting; **`node:test` + `tsx`** for unit tests
  (`npm test` → `scripts/test.mjs` runs every `*.test.ts` under `src/` and
  `worker/src/`). Vitest was avoided: v2 ships an old bundled Vite/esbuild
  with advisories, v3+ needs Node > 20.18.
- Pinned to Vite 6 / TS 5.7 because the current `create-vite` output requires
  Node ≥ 20.19; this repo targets Node 20.18+. **Wrangler is pinned to
  `~4.86.0`** (not latest) for the same reason — 4.88.0+ requires Node ≥ 22.
  `npm audit` will flag a handful of high-severity advisories in wrangler's own
  bundled dev-tooling deps (esbuild/miniflare/undici/ws) as a result; they only
  affect the local `wrangler dev` toolchain, never the deployed Worker or the
  site. If you're on Node 22+ locally, bumping `wrangler`/`@cloudflare/workers-types`
  to latest is a reasonable, isolated upgrade.
- **Cloudflare Workers + D1** for the one piece of server state this site
  has: the global brew counter. See **Brew counter backend** below.

No other runtime dependencies.

## Commands

```bash
npm install
npm run dev              # start Vite dev server (proxies /api to :8787, see below)
npm run build            # tsc project build + vite production build
npm run preview          # serve the production build locally
npm run lint             # oxlint
npm run typecheck        # tsc --noEmit
npm test                 # node:test + tsx over src/**/*.test.ts + worker/src/**/*.test.ts

# Brew counter Worker (see Brew counter backend below)
npm run worker:dev           # run the Worker locally (wrangler dev, :8787)
npm run db:migrate:local     # apply worker/migrations/*.sql to the local D1 db
npm run db:migrate:remote    # apply migrations to the REAL D1 database (needs database_id set)
npm run worker:deploy        # deploy the Worker (needs database_id set)
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
                      brewConfig.ts (every tunable), dragMath.ts (pure);
                      global counter (Milestone 5): brewApi.ts (fetch, never
                      throws), brewCounterGuard.ts (pure "count this pot
                      exactly once" state machine, unit-tested), useBrewCounter.ts
                      (wires both into React, no dedicated test — same pattern
                      as useBrew.ts)
    audio/            createChimePlayer() + a subscribable mute preference
    debug/            dev-only physics tuning panel
  hooks/          useMediaQuery, useReducedMotion, useActiveSection
  content/        portfolio copy (single edit point — real bio/projects/experience)
  styles/         tokens.css (palette / type / spacing / z-index) + global.css
worker/           Cloudflare Worker: the brew counter's backend (Milestone 5)
  wrangler.toml     D1 + Rate Limiting bindings; see Brew counter backend below
  migrations/       D1 schema (site_stats table + seed row)
  src/
    index.ts          fetch handler: routes, CORS, rate limit, error shape
    router.ts          resolveRoute() — pure method+path -> route decision
    db.ts               getBrewCount() / incrementBrewCount() against a
                        minimal D1Like interface (real D1Database satisfies
                        it structurally; tests pass a tiny in-memory fake)
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
| Scene UI   | global brew counter, contextual hint        | live        |

Data flows one way: `CafePhysics` emits a classified `ThrowResult` → the brew
state machine consumes it → the layers render off that state. `CafePhysics`
knows nothing about grinding, sound, or the filter; its only new input is a
one-bit "can the grinder accept a bean right now" gate.

Every object's position comes from `sceneConfig.ts` as a percentage anchor, with
separate `desktop` and `mobile` layouts. Both the CSS art and the physics bodies
read from that same config, so the visual scene and the physics world stay
aligned. Pixel-art PNGs replace the CSS placeholders one element at a time —
nothing here is a flattened background.

## Brew counter backend

```
React/Vite portfolio  ->  Cloudflare Worker (worker/)  ->  D1 (site_stats)
```

**Schema** (`worker/migrations/0001_init.sql`) — one table, one seeded row:

```sql
CREATE TABLE site_stats (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO site_stats (key, value) VALUES ('coffee_pots_brewed', 0);
```

**API** — one route, two methods, both JSON:

| Route            | Effect                                            |
| ----------------- | -------------------------------------------------- |
| `GET /api/brews`  | Reads the count. Never mutates.                     |
| `POST /api/brews` | Atomically `UPDATE ... SET value = value + 1 ... RETURNING value`, rate-limited, returns the new total. |

The client never sends a total — it can only ask to read the count or report
"one pot was brewed." The Worker is the only thing that ever changes the
stored value.

**Duplicate-increment protection** (client-side correctness, not security):
`useBrewCounter.ts` watches the existing brew state machine's `stage` and
calls into `BrewCounterGuard` (`brewCounterGuard.ts`, pure, unit-tested) on
every update. The guard only returns `true` on the rising edge into
`'installed'` — the moment `BrewLayer` already calls `brew.installFilter()`
after a successful drag-to-machine — and flips to "already counted" *before*
the POST's promise even settles, so React re-renders, the `[stage]` effect
re-running, and React Strict Mode's dev-only double-invoke of that same
effect can't produce a second request. The reducer itself is also a second,
independent backstop: `'carry-install'` is a no-op once `stage` is already
`'installed'` (see `brewMachine.ts`), so even a duplicate dispatch can't
re-enter the state that trips the guard.

**Abuse protection**: a Workers [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
on `POST /api/brews` — 5 accepted requests per 60 seconds, keyed by
`CF-Connecting-IP` (no auth, no cookies, nothing to log in for). A request
past the limit gets `429 {"error": "Too many requests"}` and never touches
D1. This is enforced Worker-side, so calling the API directly (bypassing the
UI entirely) is still capped.

**Local development:**

```bash
npm run db:migrate:local   # once, and again after editing worker/migrations/
npm run worker:dev         # wrangler dev on :8787 (leave running)
npm run dev                # vite on :5173+, proxies /api -> :8787 (see vite.config.ts)
```

Both the D1 database and the rate limiter are fully simulated locally by
Miniflare — `worker/wrangler.toml`'s placeholder `database_id` and the
rate limiter's `namespace_id` (just a number you pick, not a provisioned
resource) work as-is for local dev. Local D1 state lives in
`worker/.wrangler/` (gitignored).

**Deploying for real needs one manual, account-level step this milestone
intentionally stops short of:**

1. `npx wrangler login` (once, if you haven't already).
2. `npx wrangler d1 create ethancarpenter-brews`
3. Copy the `database_id` it prints into `worker/wrangler.toml`, replacing
   `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
4. `npm run db:migrate:remote` — creates `site_stats` on the real database.
5. `npm run worker:deploy`.
6. Point the production site at it. The client only ever calls the relative
   path `/api/brews` (`brewApi.ts`) — no absolute URL is hardcoded anywhere —
   so the intended production setup is a Cloudflare
   [Route](https://developers.cloudflare.com/workers/configuration/routing/routes/)
   mapping `ethancarpenter.dev/api/*` to this Worker, keeping the call
   same-origin with no CORS involved. (The Worker's own CORS headers are
   already permissive — `Access-Control-Allow-Origin: *` — as a fallback if
   you deploy it on a separate origin instead, but same-origin via a Route is
   simpler and is what this was built for.) Setting that up is deploy/launch
   wiring and is intentionally left for Milestone 7, not done here.

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

## Milestone 6 polish notes

Issues found and fixed in this pass (code-review-level; see the note on
manual verification below):

- **Touch targets under 44px**: header nav links (~38px), the mobile menu
  button (~38px), and the hero panel's collapse/expand icon buttons (30x30px)
  were all under the WCAG 2.5.5 minimum. Fixed with `min-height`/explicit
  sizing; the icon button fix also needed the panel's reserved right-padding
  bumped to match (`HeroIntro.module.css`).
- **Contrast failure**: `--color-accent` / `--color-link-hover` (the
  terracotta used for every section's "eyebrow" label and link-hover state)
  computed to roughly 3:1 against the cream background, below the 4.5:1 AA
  minimum for normal text. Added `--c-terracotta-deep` (same hue, darkened;
  ~5:1 on cream) and repointed those two semantic tokens to it. The original
  `--c-terracotta` is untouched for its non-text (game art) uses.
- **Stale/broken links**: `public/resume.pdf` existed on disk but
  `IDENTITY.resumeHref` was still blank, so the Resume button was silently
  hidden. Wired it up. Verified it's a real, non-empty PDF first.
- **Dead content**: `IDENTITY.location` was defined but never rendered
  anywhere; removed rather than wiring up a new UI element for it (out of
  scope for a polish pass).
- **Metadata**: title/meta description were generic and didn't mention the
  CS degree or real projects; tightened them, added a canonical link and
  `twitter:card` tags. No `og:image`/`twitter:image` was added — there's no
  social-preview screenshot asset yet; a real one, not a placeholder, would
  need to be provided.
- Content accuracy (project names, no em dashes, no exaggerated professional
  claims), animation quality (all custom animations were already
  `prefers-reduced-motion`-guarded and subtle), the brew counter's
  loading/error states, and secrets/localhost/console-spam/TODO hygiene were
  all audited and found already correct — nothing changed there.
- Worker bundle verified with `wrangler deploy --dry-run`: 2.78 KiB / 1.09 KiB
  gzip, bindings resolve correctly, no packaging issues.

**Needs a real browser to fully confirm** (no browser automation was
available in the session that did this pass — everything above was verified
by reading code/CSS and, for the Worker, by actually running it locally and
curling every route, not by clicking through the UI): the full responsive
layout at real device widths, the drag-to-machine brew flow end to end,
keyboard tab order through the whole page, and screen-reader output for the
brew counter and hint text.

## Milestone 7 deployment-readiness checklist

- [x] Manual browser pass: desktop/tablet/mobile widths, the full bean-toss →
      grind → carry → install flow, keyboard-only navigation. Verified in-browser
      by the site owner (2026-09-09); a final production smoke test still follows
      deployment.
- [x] Cloudflare account step: production D1 database `ethancarpenter-brews`
      created (region ENAM), `database_id` set in `worker/wrangler.toml`,
      `npm run db:migrate:remote` applied `0001_init.sql`, `npm run worker:deploy`
      shipped `ethancarpenter-brew-counter` (2026-09-09).
- [x] Production points at the Worker via the `ethancarpenter.dev/api/*` route
      declared in `worker/wrangler.toml` (`workers_dev`/`preview_urls` disabled,
      so the Worker is reachable only through that same-origin route, no CORS).
      Verified in prod: `GET`/`POST /api/brews` work, D1 persists, `/api/*` 404s
      correctly.
- [x] DNS / domain: `ethancarpenter.dev` zone active on Cloudflare, Vite build
      deployed to Cloudflare Pages project `ethan-carpenter-portfolio`, apex
      attached as a Pages custom domain, `www` → apex via a 301 Redirect Rule
      (proxied `AAAA www 100::`). HTTPS + HTTP→HTTPS verified (2026-09-09).
- [ ] Final live production smoke test: bean-toss → grind → carry → install
      flow in a real browser against `https://ethancarpenter.dev`, confirming the
      on-page brew counter increments live.
- [ ] Optional: a real `og:image`/`twitter:image` social-preview asset.
- [ ] Optional: `IDENTITY.github` and per-project `github`/`demo` links, once
      the projects are public.
- [ ] Optional: exact employment date ranges for the Experience section
      (currently "Present"/"Previously" rather than specific years).
