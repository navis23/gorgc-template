<script setup lang="ts">
import type { Series } from '~/utils/chart'
import { useElementSize } from '@vueuse/core'
import { gsap } from 'gsap'
import { formatCompact, niceScale, slotColor, smoothPath } from '~/utils/chart'

const props = withDefaults(defineProps<{
  series: Series[]
  labels: string[]
  height?: number
  area?: boolean
  smooth?: boolean
  showGrid?: boolean
  showMarkers?: boolean
  format?: (n: number) => string
}>(), {
  height: 260,
  smooth: true,
  showGrid: true,
  showMarkers: true,
  format: (n: number) => formatCompact(n),
})

const wrap = useTemplateRef<HTMLElement>('wrap')
const { width } = useElementSize(wrap)

const PAD = { top: 12, right: 12, bottom: 26, left: 44 }
// useElementSize reports 0 on the server, so SSR draws at the fallback width
// while the client draws at the measured one — the SVG geometry differs and Vue
// reports a hydration mismatch. Hold the fallback for the first client render so
// both sides agree, then adopt the real measurement on the next tick.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const w = computed(() => (mounted.value ? Math.max(240, width.value || 480) : 480))
const h = computed(() => props.height)
const plotW = computed(() => w.value - PAD.left - PAD.right)
const plotH = computed(() => h.value - PAD.top - PAD.bottom)

const scale = computed(() => {
  const all = props.series.flatMap(s => s.data).filter(n => Number.isFinite(n))
  return niceScale(Math.min(0, ...all), Math.max(0, ...all))
})

const xAt = (i: number) => {
  const n = props.labels.length
  return PAD.left + (n <= 1 ? plotW.value / 2 : (i / (n - 1)) * plotW.value)
}
const yAt = (v: number) => {
  const { min, max } = scale.value
  const t = max === min ? 0.5 : (v - min) / (max - min)
  return PAD.top + plotH.value - t * plotH.value
}

const paths = computed(() => props.series.map((s, si) => {
  const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const line = props.smooth ? smoothPath(pts) : pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const base = PAD.top + plotH.value
  const fill = pts.length
    ? `${line} L${pts.at(-1)!.x},${base} L${pts[0]!.x},${base} Z`
    : ''
  return { key: s.name, color: s.color ?? slotColor(si), line, fill, pts }
}))

// -- hover layer ------------------------------------------------------------
const hover = ref<number | null>(null)

function onMove(e: PointerEvent) {
  const box = (e.currentTarget as SVGElement).getBoundingClientRect()
  const x = e.clientX - box.left
  const n = props.labels.length
  if (n < 1)
    return
  const t = (x - PAD.left) / Math.max(1, plotW.value)
  hover.value = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
}

const tipSide = computed(() => (hover.value !== null && xAt(hover.value) > w.value * 0.6 ? 'end' : 'start'))

// -- entrance ---------------------------------------------------------------
const svg = useTemplateRef<SVGElement>('svg')
onMounted(() => {
  if (!svg.value)
    return
  const lines = svg.value.querySelectorAll<SVGPathElement>('[data-line]')
  lines.forEach((p) => {
    const len = p.getTotalLength()
    if (!len)
      return
    gsap.fromTo(p,
      { strokeDasharray: len, strokeDashoffset: len },
      {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.out',
        // A half-finished dash offset reads as a *broken* line, not an
        // unfinished one — so always clear back to the solid path.
        clearProps: 'strokeDasharray,strokeDashoffset',
        onInterrupt: () => gsap.set(p, { clearProps: 'strokeDasharray,strokeDashoffset' }),
      },
    )
  })
  // `[data-fill]` only exists when `area` is set — GSAP warns on an empty target.
  const fills = svg.value.querySelectorAll('[data-fill]')
  if (fills.length)
    gsap.from(fills, { opacity: 0, duration: 0.9, delay: 0.2 })
})
</script>

<template>
  <div ref="wrap" class="relative w-full">
    <svg
      ref="svg"
      :width="w"
      :height="h"
      :viewBox="`0 0 ${w} ${h}`"
      class="block w-full overflow-visible"
      role="img"
      :aria-label="`Line chart: ${series.map(s => s.name).join(', ')}`"
      @pointermove="onMove"
      @pointerleave="hover = null"
    >
      <!-- grid: recessive, horizontal only -->
      <g v-if="showGrid">
        <line
          v-for="t in scale.ticks"
          :key="t"
          :x1="PAD.left" :x2="w - PAD.right"
          :y1="yAt(t)" :y2="yAt(t)"
          stroke="var(--chart-grid)" stroke-width="1"
        />
      </g>

      <!-- y axis labels -->
      <text
        v-for="t in scale.ticks"
        :key="`l${t}`"
        :x="PAD.left - 8" :y="yAt(t)"
        text-anchor="end" dominant-baseline="middle"
        class="fill-[var(--chart-axis)] text-[10px] tabular-nums"
      >{{ format(t) }}</text>

      <!-- x axis labels, thinned so they never collide -->
      <text
        v-for="(lab, i) in labels"
        v-show="labels.length <= 8 || i % Math.ceil(labels.length / 8) === 0"
        :key="`x${i}`"
        :x="xAt(i)" :y="h - 8"
        text-anchor="middle"
        class="fill-[var(--chart-axis)] text-[10px]"
      >{{ lab }}</text>

      <!-- crosshair -->
      <line
        v-if="hover !== null"
        :x1="xAt(hover)" :x2="xAt(hover)"
        :y1="PAD.top" :y2="PAD.top + plotH"
        stroke="var(--chart-axis)" stroke-width="1" stroke-dasharray="3 3"
      />

      <!-- series -->
      <g v-for="p in paths" :key="p.key">
        <path v-if="area" data-fill :d="p.fill" :fill="p.color" opacity="0.12" />
        <path
          data-line
          :d="p.line"
          fill="none"
          :stroke="p.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- 2px surface ring keeps overlapping markers legible -->
        <circle
          v-if="showMarkers && hover !== null && p.pts[hover]"
          :cx="p.pts[hover]!.x" :cy="p.pts[hover]!.y" r="4.5"
          :fill="p.color" stroke="var(--chart-surface)" stroke-width="2"
        />
      </g>
    </svg>

    <div
      v-if="hover !== null"
      class="pointer-events-none absolute top-2 z-10 min-w-32 rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)] p-2.5 shadow-float"
      :class="tipSide === 'end' ? 'end-2' : 'start-12'"
    >
      <p class="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">{{ labels[hover] }}</p>
      <ul class="space-y-1">
        <li v-for="(p, i) in paths" :key="p.key" class="flex items-center gap-2 text-xs">
          <span class="size-2 shrink-0 rounded-[2px]" :style="{ background: p.color }" />
          <span class="truncate text-[var(--text-muted)]">{{ series[i]!.name }}</span>
          <span class="ms-auto font-medium tabular-nums text-[var(--text-strong)]">
            {{ format(series[i]!.data[hover] ?? 0) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
