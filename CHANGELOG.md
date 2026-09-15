# Changelog

Versioned as `vMAJOR.MINOR.PATCH`. Every entry was verified before release:
typecheck clean, production build clean, every page rendered in a real browser,
and hydration counted per page. See `CONVENTIONS.md` for the protocol.

---

## v0.5.1 — stat tiles stop contradicting themselves

**Fixed**
- `GorgStatTile` knew about `invert` but never passed it to its sparkline, and
  `GorgSparkline` hardcoded "up is good". On a lower-is-better metric the tile
  showed a green delta beside a red falling line. `GorgSparkline` now takes
  `invert` and the tile forwards it. Ten pages use inverted tiles.
- `index.vue` hardcoded `+12.8%` and `+4.3%` deltas next to seeded walks that
  could end down — a green delta beside a red sparkline describing the same
  metric. Deltas are now derived from the series they sit beside, so they cannot
  disagree by construction.

---

## v0.5.0 — adoption batch 2

Six dashboards. **48 pages, 95 components.**

**Added**
- Dashboards: messaging, jobs, writer, influencer, video, flights
- `useAppNav()` — the dashboards and starters sections now derive from the route
  table. A hand-written list had drifted and left six dashboards and four
  starters unreachable; deriving makes that impossible. A route missing from the
  metadata map still appears, with a title-cased fallback.
- `CHANGELOG.md`, `HANDOFF.md`, and a "Pitfalls found the hard way" section in
  `CONVENTIONS.md`

**Fixed**
- `GorgBarChart` declared a `horizontal` prop that was never implemented — the
  API lied. Removed; no page was passing it.

**Note.** A long-running dev server can under-generate Tailwind for files created
after it started: a utility appears in the markup and in the production CSS but
in no stylesheet dev serves, even after a restart. It reads exactly like a markup
bug. Production output was verified correct. Recorded in `CONVENTIONS.md`.

---

## v0.4.0 — adoption batch 1

Six dashboards and four starters. **42 pages, 95 components.**

**Added**
- Dashboards: human-resources, delivery, company, stocks, course, health
- Starters: sidebar, topnav, collapse, blank
- Layouts for the sidebar, topnav and collapse shells
- `utils/nav.ts`, `useBreadcrumbs()`, `AppToolbar` — extracted before three new
  layouts could each copy them; `default.vue` went from ~60 lines to 18

**Fixed**
- Hydration node mismatch on **every sidenav page since v0.1.0**.
  `GorgSidenavRailItem` renders a `TooltipPortal`, and the layout footer reaches
  it through a nested slot passthrough; a portal behind double slot indirection
  hydrates inconsistently.
- `GorgFlexTableCell` applied `flex-basis` as an unconditional inline style. The
  row is `flex-col` below `md`, where basis sizes the main axis — height — so a
  cell declared 18rem wide became 18rem tall on a phone. Affected project,
  ecommerce and sales.
- `GorgStatTile` silently rounded fractional values; it now takes `decimals`.

**Note.** Three of the four shells had *zero* usage before this release — 24
components built, typechecked and committed but rendered by no page.

---

## v0.3.1 — adopt the Tier 2 components

**Changed**
- `wizard.vue` uses `GorgStepper`. This needed an API extension: `linear` only
  knows about the current step, so it could not express "any step already
  reached". `Step` gained an explicit `disabled`.
- `invoice.vue` uses `GorgTimeline`, bringing real `<time datetime>` semantics.
  `InvoiceEvent.at` became a `Date`; `GorgTimeline` gained the `info` tone.

**Fixed**
- `/charts` consumed the shared seeded RNG inside page setup via `walk()`. The
  server and client reach that call at different stream positions, so grid
  coordinates disagreed (`y1="178.5"` server, `y1="160"` client).

**Note.** `record-detail.vue` has no timeline — an earlier claim that it did was
wrong. It has a comment thread and a milestone checklist.

---

## v0.3.0 — Tier 2 components

**Added**
- `GorgDatePicker`, `GorgDateRangePicker` on Reka's Calendar primitives
- `GorgPopover`, `GorgAccordion`
- `GorgConfirm` + `useConfirm` — `confirm(options) => Promise<boolean>`, with an
  optional type-to-confirm gate for irreversible actions
- `GorgCommandPalette` (⌘K), `GorgStepper`, `GorgTimeline`
- `usePersistedState` — localStorage-backed state that holds its default through
  hydration, applied to the four shells that read storage during render
- `@internationalized/date` as an explicit dependency

**Fixed**
- `animate-in` / `fade-in` / `zoom-in-95` came from `tailwindcss-animate`, which
  is **not installed**, so they generated no CSS and `GorgModal` and
  `GorgTooltip` had no entrance or exit at all. Replaced with keyframes on
  gorg's own motion tokens. Also a correctness fix: Reka's `Presence` only
  defers unmount for real CSS keyframe animations.
- Those keyframes animate the standalone `scale` property, not `transform`, so a
  centred dialog's translate is not wiped out mid-animation.

**Note.** Reka's calendar heading and weekday parts format through `Intl`, whose
data differs between Node and the browser. Every human-readable date string is
rendered from `utils/datetime` instead.

---

## v0.2.0 — migrate pages onto the shared primitives

The duplication the primitives were built for is gone from the pages, not merely
avoidable.

- 10 pages dropped hand-rolled `query`/`sortKey`/`page` refs for `useCollection`
- 6 pages dropped hand-rolled `aria-pressed` button groups for `GorgSegmented`,
  which also gave all of them arrow/Home/End keyboard navigation they lacked
- `GorgSegmented` gained a `pill` variant so the analytics range control kept its
  original solid active segment instead of silently becoming a raised chip

---

## v0.1.1 — shared primitives

**Added**
- `GorgSegmented` — mutually-exclusive view switcher, with keyboard navigation
- `useCollection` — search + filter + sort + paginate, including the page-clamp
  rule each page had been re-implementing independently
- `utils/datetime.ts` — one fixed epoch, one month/weekday array, nine
  formatters, replacing 12 scattered helpers across 4 files

---

## v0.1.0 — initial system

85 components, 32 pages, built from scratch on Nuxt 4.5 · Vue 3.5 ·
Tailwind 4.3 (CSS-first `@theme`) · Reka UI · GSAP 3.15.

- 4 application shells sharing one content-slot contract
- Chart palette chosen computationally and validated for lightness band, chroma
  floor, colour-vision-deficiency separation and contrast — light and dark
  stepped independently rather than flipped
- GSAP motion layer additive over CSS transitions, honouring
  `prefers-reduced-motion` and never hiding content if a tween fails to run
