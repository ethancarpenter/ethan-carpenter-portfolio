# ethancarpenter.dev

Personal developer portfolio, built as a cozy retro pixel-art cafe. The About /
Projects / Experience / Skills / Contact content is plain, accessible HTML;
alongside it there's an interactive scene where you toss coffee beans into a
grinder, grind enough for a pot, and brew it, which bumps a real, shared global
"pots brewed" counter. The game never gates any of the portfolio content.

Live at **<https://ethancarpenter.dev>**.

## Stack

- **React 19** + **TypeScript**, bundled with **Vite 6**, styled with plain **CSS Modules**.
- **Matter.js 0.20** for the bean physics — instantiated only for the cafe scene, torn down with it.
- **oxlint** for linting. Unit tests run on **`node:test` + `tsx`** (no test framework): `npm test`
  executes `scripts/test.mjs`, which runs every `*.test.ts` under `src/` and `worker/src/`.
- **Cloudflare Workers + D1** for the one piece of server state — the global brew counter
  (`worker/`). Managed with **Wrangler**.
- No other runtime dependencies. The production site is a static Vite build.

## Prerequisites

- **Node.js >= 22** (`.nvmrc` pins `22`). Wrangler 4.88+ requires Node 22, and Node 20 is
  end-of-life; the whole toolchain targets 22.
- **npm** (ships with Node).
- A **Cloudflare account** only if you want to run or deploy the brew-counter Worker.
  The portfolio site itself needs nothing beyond Node.

## Setup from a fresh clone

```bash
git clone https://github.com/ethancarpenter/ethan-carpenter-portfolio.git
cd ethan-carpenter-portfolio
npm ci
npm run dev          # Vite dev server on http://localhost:5173
```

That's the whole portfolio site. The brew counter will show a `———` placeholder until the
Worker is also running (below) — the game stays fully playable without it.

### Running the brew-counter Worker locally

The Worker and its D1 database and rate limiter are all simulated locally by Miniflare — no
Cloudflare account, login, or real database is needed for local development.

```bash
npm run db:migrate:local   # apply worker/migrations/*.sql to the local D1 (run once, and after schema changes)
npm run worker:dev         # wrangler dev on http://localhost:8787 — leave this running
npm run dev                # Vite proxies /api/* -> :8787 (see vite.config.ts)
```

Local D1 state lives in `worker/.wrangler/` (gitignored). The Worker needs no secrets or
`.dev.vars`; its only bindings are the D1 database (`DB`) and a Workers rate-limit binding,
both declared in `worker/wrangler.toml`.

## Commands

### Local only — safe, never touch anything remote

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (`:5173`) |
| `npm run build` | Type-check the whole project (`tsc -b`) then produce the production build in `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b --noEmit` across the app and the Worker |
| `npm test` | `node:test` + `tsx` over every `*.test.ts` in `src/` and `worker/src/` |
| `npm run worker:dev` | Run the Worker locally against a simulated D1 (`:8787`) |
| `npm run db:migrate:local` | Apply migrations to the **local** simulated D1 |

### Mutates production — requires `wrangler login` and hits Ethan's Cloudflare account

| Command | What it does |
| --- | --- |
| `npm run db:migrate:remote` | Apply `worker/migrations/*.sql` to the **real** D1 database |
| `npm run worker:deploy` | Build and deploy the Worker to Cloudflare |

The static site itself is deployed separately, to Cloudflare Pages, with:

```bash
npm run build
npx wrangler pages deploy dist --project-name=ethan-carpenter-portfolio --branch=main
```

`npm run build` is local and harmless; the `wrangler pages deploy` line publishes to the live
site and is not part of any npm script for that reason.

## Project layout

```
src/
  components/   site shell — header/nav, footer, skip link
  sections/     portfolio sections (Home + About/Projects/Experience/Skills/Contact)
  content/      portfolio.ts — the single source of truth for all rendered copy
  game/         the interactive cafe scene
    CafeScene.tsx    composes six stacked layers, owns the brew state
    sceneConfig.ts   percentage anchors for every object (separate desktop + mobile layouts)
    layers/          Background · Objects · Physics · Brew · Effects · SceneUI
    objects/         BeanBowl · Grinder · CoffeeMachine / Carafe (CSS + a physics-driven canvas)
    physics/         Matter.js engine lifecycle, scene geometry, bean factory, spring-tether
                     grab, throw tracker, the pure swept top-entry gate (hopperEntry.ts),
                     the shared grinder-funnel geometry (grinderGeometry.ts), tuning config
    scoring/         classifyThrow() — pure, deterministic, unit-tested
    brew/            grind -> fill -> carry -> install -> reset flow: brewMachine.ts (pure
                     reducer), useBrew.ts (timers + chime), BrewLayer.tsx (filter basket),
                     and the global counter: brewApi.ts (fetch, never throws),
                     brewCounterGuard.ts (pure "count each pot exactly once"), useBrewCounter.ts
    audio/          a lazily-created Web Audio chime + a persisted mute preference
    debug/          dev-only physics overlay (also reachable in any build via ?debug)
  hooks/         useMediaQuery, useReducedMotion, useElementSize, useActiveSection
  styles/        tokens.css (palette / type / spacing / z-index) + global.css
worker/          the brew counter's Cloudflare Worker
  wrangler.toml    D1 + rate-limit bindings, the production route, migrations dir
  migrations/      D1 schema (a one-row site_stats counter table)
  src/
    index.ts       fetch handler: routing, CORS fallback, rate limit, error shape
    router.ts      resolveRoute() — pure method + path -> route decision
    db.ts          getBrewCount() / incrementBrewCount() against a minimal D1-like interface
```

## How the cafe scene works

`<CafeScene>` stacks six full-size layers (z-index from `tokens.css`): Background, Objects,
Physics (a Matter.js `<canvas>`), Brew (the filter basket + grounds), Effects, and Scene UI
(the brew counter + a contextual hint). Data flows one way: `CafePhysics` classifies each
throw into a `ThrowResult`, the pure brew state machine consumes it, and the layers render
off that state.

Every object's position comes from `sceneConfig.ts` as a percentage anchor. Both the CSS art
and the Matter.js bodies derive from that same config — including the grinder funnel, whose
visible catch surfaces and collision bodies are generated from one shared pure function
(`grinderGeometry.ts`) so they can't drift apart. The whole scene is exposed to assistive
tech as a single labelled group with `aria-hidden` decorative sub-layers; nothing needed to
use the site lives inside it.

Append `?debug` to any URL (including the production one) to draw the collision geometry,
the top-entry gate, and per-bean vectors over the scene. It is never shown otherwise.

## Brew counter backend

```
React/Vite site  ->  Cloudflare Worker (worker/)  ->  D1 (site_stats)
```

**Schema** (`worker/migrations/0001_init.sql`) — one table, one seeded row:

```sql
CREATE TABLE site_stats (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO site_stats (key, value) VALUES ('coffee_pots_brewed', 0);
```

**API** — one route, two methods, both JSON:

| Route | Effect |
| --- | --- |
| `GET /api/brews` | Reads the count. Never mutates. |
| `POST /api/brews` | Atomically `UPDATE ... SET value = value + 1 ... RETURNING value`, rate-limited, returns the new total. |

The client can only ask to read the count or report "one pot was brewed" — it never sends a
total. `useBrewCounter.ts` + the pure, unit-tested `BrewCounterGuard` make sure exactly one
`POST` happens per completed pot, even across React re-renders and Strict Mode's dev-only
double-invoke. `POST /api/brews` is rate-limited by a Workers rate-limit binding to 5
accepted requests per 60s per `CF-Connecting-IP`; a request past the limit gets a `429` and
never touches D1.

**Production wiring** (already in place): the static site is served from Cloudflare Pages at
`ethancarpenter.dev`; a Worker route `ethancarpenter.dev/api/*` peels off just the API to
this Worker, so calls stay same-origin with no CORS. `workers_dev` and `preview_urls` are
disabled, so the Worker is reachable only through that route. `www` 301-redirects to the
apex.

**Deploying the Worker to a different account** would need: `wrangler login`, then
`wrangler d1 create <name>` and putting the new `database_id` into `worker/wrangler.toml`,
then `npm run db:migrate:remote` and `npm run worker:deploy`, then a Worker route (or, if the
API lives on a separate origin, the Worker already sends permissive `Access-Control-Allow-Origin`
headers as a fallback).

## Accessibility

- Skip link, semantic landmarks, one `<h1>`, section `<h2>`s with `aria-labelledby`.
- Keyboard-operable nav with a mobile disclosure menu (Esc to close), visible focus rings,
  and 44px minimum touch targets throughout — including the in-scene "Empty pot" control.
- `prefers-reduced-motion` drops transitions, smooth scroll, and animation; the bean toy is
  entirely user-driven (it only moves while you move the pointer) and damps harder under
  reduced motion so nothing keeps moving on its own.
- The cafe scene is decorative and skippable — every piece of feedback in the brew flow is
  visual (grinder shake, falling grounds, filling filter, carafe fill), never sound-only; the
  chime is opt-out and never autoplays.
- `touch-action: none` is scoped to the bean canvas and the filter basket only, so a drag
  never scrolls the page while the page scrolls normally everywhere else.

## Dependencies and security

- `npm audit` is clean (0 vulnerabilities) as of the latest dependency pass. `wrangler` and
  `@cloudflare/workers-types` are on their current majors (4.13x / 5.x), which is what moved
  the minimum Node version to 22.
- Nothing sensitive is committed: there are no `.env` files (gitignored, with `*.example`
  allowed), no API tokens, no `.dev.vars`. The Worker uses no secrets. `worker/wrangler.toml`
  contains a Cloudflare D1 **database id** — an account-scoped resource identifier, not a
  credential; it grants no access without a separately-authenticated Cloudflare login.
- CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, type-check, tests, and the production
  build on every push to `main` and every pull request. It has read-only permissions and
  never deploys or touches Cloudflare or the production database.

## License

MIT — see [LICENSE](LICENSE).
