# gorg — build conventions

gorg is an original admin/dashboard UI system. Tairo is used only as a
*functional* reference: what a component must do, which states it needs.
Never transcribe Tairo markup or class strings — write fresh implementations
against our own tokens.

## Stack
Nuxt 4.5 · Vue 3.5 · Tailwind 4.3 (CSS-first `@theme`) · Reka UI · GSAP 3.15

## Naming
- Prefix every component `Gorg*`. Flat resolution (`pathPrefix: false`),
  so filenames must be globally unique.
- Folders group by family: `base/`, `form/`, `data/`, `nav/`, `shell/`,
  `chart/`, `feedback/`, `widget/`.

## Tokens — never hardcode a hex or a Tailwind default colour
- Brand: `tide-50..950`. Accent: `ember-50..950`. Neutral: `ink-50..950`.
- Semantic: `--color-positive|caution|critical|info`.
- Surfaces via CSS vars so dark mode is automatic:
  `var(--surface-page|raised|sunken|border)`, `var(--text-strong|muted)`.
- Radii: `rounded-card|field|pill`. Shadows: `shadow-raise|float|lift`.
- Motion: `duration-(--duration-snap|base|slow)`.

## Dark mode
`@custom-variant dark` keys off `.dark` on `<html>`. Prefer surface vars —
they already flip. Only reach for `dark:` when a var cannot express it.

## Component shape
```vue
<script setup lang="ts">  // always TS, always <script setup> first
</script>
<template>  </template>   // no <style> blocks; Tailwind only
```
- Props via `withDefaults(defineProps<{...}>(), {...})`.
- Emits via `defineEmits<{ name: [payload: T] }>()`.
- `defineModel()` for two-way binding.
- Build on Reka UI primitives for anything with a11y surface (menus,
  dialogs, popovers, tabs, accordion, combobox). Do not hand-roll focus traps.

## Motion
Import from `~/composables/useMotion`: `useReveal`, `useStagger`, `useCounter`.
CSS transitions stay for hover/focus micro-states. GSAP is additive — it owns
scroll reveals, staggered entrances, counters, page transitions.
Add `class="js-reveal"` to anything `useReveal` animates.

## Accessibility
Real semantics (`<button>`, `<nav>`, `<table>`), labelled controls,
visible `:focus-visible`, `aria-*` on custom widgets, respect
`prefers-reduced-motion` (already handled globally by the gsap plugin).

## Use the shared primitives — do not hand-roll these

These exist because the same logic had been rewritten across a dozen pages.
Reach for them before writing your own.

| Need | Use | Not |
|---|---|---|
| Mutually-exclusive view/mode choice | `<GorgSegmented v-model :items>` | a `v-for` of `aria-pressed` buttons |
| Search / filter / sort / paginate a list | `useCollection(source, {...})` | per-page `query`/`sortKey`/`page` refs |
| Any date or time string | `~/utils/datetime` | a local formatter or `new Date()` |
| Money | `formatCurrency` (decimals) or `formatCents` (integer cents) | `toLocaleString` |

`GorgSegmented` is only for a *group* of mutually-exclusive options. A single
on/off button (password reveal, follow) stays a plain button with `aria-pressed`,
and a long filter list stays a `<nav>` of chips — neither is a segmented control.

## Two rules that come from real bugs

**Never let animation hide content.** `useReveal`/`useStagger` pass
`immediateRender: false` so a tween that never runs leaves the element visible.
A GSAP call that stamps `opacity: 0` up front will blank the page if its trigger
mis-measures. Guard `querySelectorAll` results before tweening them — GSAP warns
on empty targets.

**Never format with the runtime's locale data.** `toLocaleString` and
`Intl.NumberFormat` use the ICU data built into the runtime, and Node's differs
from the browser's. That makes SSR and client render different text, which Vue
reports as a hydration mismatch. Format by hand; `utils/datetime.ts` and
`utils/chart.ts` already do.

Anything measured from the DOM (`useElementSize`) reads 0 on the server, so gate
it behind a `mounted` ref and hold the SSR fallback for the first client render —
otherwise the two sides disagree.

## Pitfalls found the hard way

Each of these shipped as a real bug in this project. They are cheap to avoid and
expensive to find.

**Grid children need `min-w-0`.** A grid item defaults to `min-width:auto`, so a
card holding a wide table overflows its track and the table's own
`overflow-x-auto` never engages. Any grid child containing a table or chart gets
`min-w-0`.

**`flex-basis` sizes the MAIN axis.** In a `flex-col` container that is height,
not width. A responsive row that is `flex-col` below `md` must gate any basis
behind the same breakpoint, or a "wide" cell becomes a tall one on phones.

**Portals behind slot indirection break hydration.** A component rendering a
Reka `*Portal` (tooltip, popover, dialog) placed into a slot that is itself
forwarded through another slot hydrates inconsistently — the server renders
nothing where the client renders the component. Pass it directly, or disable the
portal-bearing part in that position.

**`useCounter` rounds.** `GorgStatTile` takes `decimals`; pass it for fractional
metrics or 36.8 animates to 37. Do not encode tenths and divide in the formatter.

**Never consume shared mutable state during render.** `walk()` in `utils/mock.ts`
draws from one seeded stream. Calling it inside a page's `setup` puts the server
and the client at different stream positions and they render different numbers.
Precompute fixtures at module scope, or use a generator local to your own file.

**Dev can under-generate Tailwind for newly added files.** A long-running dev
server may never emit a utility that appears only in a file created after it
started — `lg:w-56` rendered in the markup, existed in the production CSS, and
was absent from every stylesheet dev served, even after a restart. The page
looks broken in dev while being correct in production, which reads exactly like
a markup bug. `touch app/assets/css/main.css` forces a rescan. Confirm against
`pnpm build` output before believing a dev-only layout fault — and grep the CSS
for the **escaped** selector (`lg\:w-56`), since Tailwind escapes the colon and
a literal grep silently finds nothing.

## Verifying your work

Typecheck passing is not evidence that a page works — curl and SSR both pass
while the client crashes. Required, in order:

1. `pnpm nuxt typecheck` — zero `error TS`.
2. Render each route in a real browser and confirm it did not fall back to the
   error page: `chromium --headless --disable-gpu --no-sandbox
   --virtual-time-budget=9000 --dump-dom "<url>" | grep -c 'Something broke'`
   must be 0, with real content present.
3. Count hydration warnings **per page, by log byte offset** — record the log
   size before and after a single render and count only that range. Counting
   over a whole sweep under-reports and has hidden real bugs here more than once.
4. After any scripted edit, assert the change is actually in the file before
   reporting it. A no-op `str.replace` reports success just as loudly.
