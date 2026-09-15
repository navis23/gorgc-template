# gorg

An original admin & dashboard UI system for Nuxt 4.

Built as a ground-up implementation — Tairo was used only as a *functional*
reference (which components an admin kit needs, which states each must cover).
The token system, component APIs, markup and motion design here are gorg's own.

## Stack

| | |
|---|---|
| Framework | Nuxt 4.5 · Vue 3.5 · Nitro 2.13 · Vite 8 |
| Styling | Tailwind 4.3, CSS-first `@theme` (no `tailwind.config.js`) |
| Primitives | Reka UI — accessibility-critical widgets are never hand-rolled |
| Motion | GSAP 3.15 + ScrollTrigger + Flip, as an additive layer |

## Run

```bash
pnpm install --ignore-workspace   # gorg is standalone, not a Tairo workspace member
pnpm dev                          # http://localhost:3000
```

## Design tokens

Three ramps, defined once in `app/assets/css/main.css`:

- `tide-50..950` — brand (cool desaturated teal)
- `ember-50..950` — accent (warm coral), used sparingly
- `ink-50..950` — neutral (blue-shifted)

Surfaces are CSS variables so dark mode flips without `dark:` variants
everywhere: `--surface-page|raised|sunken|border`, `--text-strong|muted`.

Radii `rounded-card|field|pill` · shadows `shadow-raise|float|lift` ·
motion `--duration-snap|base|slow`, `--ease-entrance|exit`.

## Charts

`--chart-1..7` is a **fixed categorical order**: a series keeps its slot for the
life of the chart, so filtering never repaints the survivors. Light and dark are
independently chosen steps, not a lightness flip.

Both palettes were validated computationally (not by eye) and pass all five
measurable checks — lightness band, chroma floor, colour-vision-deficiency
separation, normal-vision separation, and contrast against their own surface.

Every chart ships a data-table view, a legend for 2+ series, and a hover layer.
Deltas carry a direction icon and a sign, so meaning is never colour-alone.

## Motion

`app/composables/useMotion.ts` exposes `useReveal`, `useStagger`, `useCounter`.
CSS transitions keep hover/focus micro-states; GSAP owns scroll reveals,
staggered entrances, counters and drawer/page transitions.
`prefers-reduced-motion` is handled globally in `app/plugins/gsap.client.ts`.
Elements animated by `useReveal` need `class="js-reveal"` so they do not flash
before GSAP takes over.

## Layout

```
app/
  assets/css/main.css   design tokens + chart palette
  components/
    base/    Button Card Avatar Badge
    form/    inputs, selects, checkboxes, radios, switches, file drop
    data/    tables, flex tables, pagination, empty states
    nav/     menu, dropdown, drawer, breadcrumb, tabs, theme toggle
    shell/   sidenav · sidebar · topnav · collapse application shells
    chart/   line/area, bar, donut, sparkline, gauge, stat tile
    feedback/ alert, modal, progress, toaster
  composables/  useMotion useTheme useToast
  utils/        chart.ts (scales, paths, palette) · mock.ts (demo data)
```

Components resolve flat (`pathPrefix: false`), so every filename is globally
unique and `<GorgButton />` works from anywhere.

See `CONVENTIONS.md` before adding components.
