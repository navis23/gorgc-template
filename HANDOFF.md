# Handoff

Written at **v0.5.0**, 2026-09-15, as a checkpoint before `/clear`. Read this
plus `CONVENTIONS.md` and you have everything needed to continue.

## What this is

**gorg** — an original Nuxt 4 admin/dashboard UI system at
`/home/kambing23/Dev/Tairo2/gorg`, pushed to
`https://github.com/navis23/gorgc-template` (public, no LICENSE yet).

It lives inside a clone of the commercial **Tairo** template but shares no code
with it. Tairo is used only as a *functional checklist* — which components and
page archetypes an admin kit needs. Never open or copy its files; agents are
always told the same. Because nothing was ported, Tairo's Envato licence does
not follow gorg, which is what makes the public repo safe.

The Tairo clone must stay pristine: `git status` in `Dev/Tairo2` should show
only `gorg/` as untracked.

## State

```
version     v0.5.0
pages       48        components 95        LOC ~29,500
stack       Nuxt 4.5 · Vue 3.5 · Tailwind 4.3 (CSS-first @theme) · Reka UI · GSAP 3.15
verified    typecheck 0 · build 0 · 48/48 render · 0 hydration mismatches
```

## Remaining gap

Tairo has 116 layout files but only **49 distinct archetypes**, and 37 dashboard
files for **31 stems** — roughly 67 files are numbered variants (`card-grid-1..4`).
Batches target archetypes, not variants. This was agreed explicitly.

| | archetypes | done | left |
|---|---|---|---|
| dashboards | ~31 | 17 | ~14 |
| layouts | ~49 | 19 | ~30 |
| auth / wizard / starters | ~12 | 10 | ~2 |

**~46 distinct pages left**, roughly eight more batches.

## The process

Batches of ~6 pages: two parallel agents of 3 pages each, plus my own share.
Split agent work by **whole file ownership** — two agents editing one file
clobber each other, and each agent gets its own `app/utils/mock-*.ts`.

Next suggested batch: `calendar`, `balance`, `personal`, `quickview`, `soccer`,
`trading` dashboards — or switch to the layouts archetypes, which are the larger
remaining block.

## How to run

```bash
cd /home/kambing23/Dev/Tairo2/gorg
pnpm dev                       # :3000 by default; PORT=3002 used in session
pnpm build && node .output/server/index.mjs   # production, far lighter for sweeps
```

Node 24 is pinned by a local `mise.toml`, excluded via `.git/info/exclude` so the
Tairo clone stays clean. Run **one or two** dev servers at most — four Nuxt
instances OOM-killed this 15 GB machine once.

## Verifying — the part that matters

`CONVENTIONS.md` has the full protocol. The short version, each learned the hard
way:

1. **Typecheck is not evidence.** curl and SSR both pass while the client
   crashes. A 32-route curl sweep once reported all green while a page blanked
   in browsers.
2. **Render every route in a real browser** and grep for `Something broke`.
3. **Count hydration per page, by log byte offset** — never in aggregate.
   Aggregate counting hid a mismatch present on every sidenav page since the
   first commit.
4. **Validate the detector itself.** A sweep once grepped `>500<` as an error
   marker; a chart's y-axis label "500" produced a phantom failure chased
   through three wrong hypotheses.
5. **Assert scripted edits landed.** A no-op `str.replace` reports success as
   loudly as a real one.
6. **Grep CSS for the escaped selector** (`lg\:w-56`) — Tailwind escapes the
   colon and a literal grep silently finds nothing.

## Known traps

- **Dev under-generates Tailwind** for files created after the server started —
  the utility appears in the markup and in the production CSS but in no
  stylesheet dev serves, even after a restart. Looks exactly like a markup bug.
  `touch app/assets/css/main.css` forces a rescan; confirm against `pnpm build`.
- `GorgLineChart` crowds x-axis ticks at 400px on 30-day series. Affects
  `/dashboards/analytics` equally — a component-level thinning rule, not a page
  bug.
- `GorgWidgetRankedList` colours rows from the same slot palette pages use for
  categories, so a reader can briefly conflate the two meanings.

## Durable design decisions

- **Nav derives from the route table** (`useAppNav`). A hand-written list drifted
  and left six dashboards and four starters unreachable. `/layouts` index
  self-discovers the same way. A route missing from the metadata map still
  appears, with a title-cased fallback.
- **Never `toLocaleString`/`Intl`** — Node and the browser ship different ICU
  data, so the two renders disagree. Use `utils/datetime.ts` and `utils/chart.ts`.
- **Never consume shared mutable state during render.** `walk()` in `utils/mock.ts`
  draws from one seeded stream; calling it in a page's setup puts server and
  client at different positions.
- **Four shells share one content-slot contract**, so a page swaps layout with
  one line of `definePageMeta`.
- Chart palette was chosen computationally and validated for CVD separation and
  contrast; light and dark are independently stepped, not flipped.
