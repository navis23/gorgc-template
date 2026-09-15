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
