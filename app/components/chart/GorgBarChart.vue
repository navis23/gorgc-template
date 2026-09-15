<script setup lang="ts">
import type { Series } from '~/utils/chart'
import { useElementSize } from '@vueuse/core'
import { gsap } from 'gsap'
import { formatCompact, niceScale, slotColor } from '~/utils/chart'

const props = withDefaults(defineProps<{
  series: Series[]
  labels: string[]
  height?: number
  stacked?: boolean
  showGrid?: boolean
  format?: (n: number) => string
}>(), { height: 260, showGrid: true, format: (n: number) => formatCompact(n) })

const wrap = useTemplateRef<HTMLElement>('wrap')
const svg = useTemplateRef<SVGElement>('svg')
const { width } = useElementSize(wrap)

const PAD = { top: 12, right: 12, bottom: 26, left: 44 }
// useElementSize reports 0 on the server, so SSR draws at the fallback width
// while the client draws at the measured one — the SVG geometry differs and Vue
// reports a hydration mismatch. Hold the fallback for the first client render so
// both sides agree, then adopt the real measurement on the next tick.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const w = computed(() => (mounted.value ? Math.max(240, width.value || 480) : 480))
const plotW = computed(() => w.value - PAD.left - PAD.right)
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

const scale = computed(() => {
  const totals = props.stacked
    ? props.labels.map((_, i) => props.series.reduce((a, s) => a + (s.data[i] ?? 0), 0))
    : props.series.flatMap(s => s.data)
  return niceScale(Math.min(0, ...totals), Math.max(0, ...totals))
})

const yAt = (v: number) => {
  const { min, max } = scale.value
  const t = max === min ? 0 : (v - min) / (max - min)
  return PAD.top + plotH.value - t * plotH.value
}

const GAP = 2 // surface gap between adjacent/stacked marks
const group = computed(() => plotW.value / Math.max(1, props.labels.length))
const barW = computed(() => {
  const usable = group.value * 0.62
  return props.stacked ? usable : Math.max(3, (usable - GAP * (props.series.length - 1)) / props.series.length)
})

const bars = computed(() => {
  const out: Array<{ key: string, x: number, y: number, h: number, color: string, name: string, value: number, label: string }> = []
  props.labels.forEach((label, i) => {
    const gx = PAD.left + i * group.value + (group.value - (props.stacked ? barW.value : barW.value * props.series.length + GAP * (props.series.length - 1))) / 2
    let acc = 0
    props.series.forEach((s, si) => {
      const v = s.data[i] ?? 0
      const color = s.color ?? slotColor(si)
      if (props.stacked) {
        const y0 = yAt(acc)
        const y1 = yAt(acc + v)
        out.push({ key: `${i}-${si}`, x: gx, y: y1, h: Math.max(0, y0 - y1 - GAP), color, name: s.name, value: v, label })
        acc += v
      }
      else {
        const y = yAt(v)
        out.push({
          key: `${i}-${si}`,
          x: gx + si * (barW.value + GAP),
          y, h: Math.max(0, yAt(0) - y), color, name: s.name, value: v, label,
        })
      }
    })
  })
  return out
})

const hover = ref<string | null>(null)
const hovered = computed(() => bars.value.find(b => b.key === hover.value) ?? null)

onMounted(() => {
  if (!svg.value)
    return
  const bars = svg.value.querySelectorAll('[data-bar]')
  if (!bars.length)
    return
  gsap.from(bars, {
    scaleY: 0,
    transformOrigin: 'bottom',
    duration: 0.6,
    ease: 'power3.out',
    stagger: { each: 0.03, from: 'start' },
  })
})
</script>

<template>
  <div ref="wrap" class="relative w-full">
    <svg
      ref="svg"
      :width="w" :height="height" :viewBox="`0 0 ${w} ${height}`"
      class="block w-full overflow-visible"
      role="img"
      :aria-label="`Bar chart: ${series.map(s => s.name).join(', ')}`"
    >
      <g v-if="showGrid">
        <line
          v-for="t in scale.ticks" :key="t"
          :x1="PAD.left" :x2="w - PAD.right" :y1="yAt(t)" :y2="yAt(t)"
          stroke="var(--chart-grid)" stroke-width="1"
        />
      </g>

      <text
        v-for="t in scale.ticks" :key="`l${t}`"
        :x="PAD.left - 8" :y="yAt(t)" text-anchor="end" dominant-baseline="middle"
        class="fill-[var(--chart-axis)] text-[10px] tabular-nums"
      >{{ format(t) }}</text>

      <text
        v-for="(lab, i) in labels"
        v-show="labels.length <= 10 || i % Math.ceil(labels.length / 10) === 0"
        :key="`x${i}`"
        :x="PAD.left + i * group + group / 2" :y="height - 8"
        text-anchor="middle" class="fill-[var(--chart-axis)] text-[10px]"
      >{{ lab }}</text>

      <rect
        v-for="b in bars" :key="b.key"
        data-bar
        :x="b.x" :y="b.y" :width="barW" :height="b.h"
        :fill="b.color" rx="4"
        class="transition-opacity duration-150"
        :opacity="hover && hover !== b.key ? 0.45 : 1"
        @pointerenter="hover = b.key"
        @pointerleave="hover = null"
      />
    </svg>

    <div
      v-if="hovered"
      class="pointer-events-none absolute top-2 end-2 z-10 rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)] p-2.5 shadow-float"
    >
      <p class="mb-1 text-[11px] font-medium text-[var(--text-muted)]">{{ hovered.label }}</p>
      <p class="flex items-center gap-2 text-xs">
        <span class="size-2 rounded-[2px]" :style="{ background: hovered.color }" />
        <span class="text-[var(--text-muted)]">{{ hovered.name }}</span>
        <span class="ms-3 font-medium tabular-nums text-[var(--text-strong)]">{{ format(hovered.value) }}</span>
      </p>
    </div>
  </div>
</template>
