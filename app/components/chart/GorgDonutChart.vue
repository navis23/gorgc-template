<script setup lang="ts">
import { gsap } from 'gsap'
import { formatCompact, slotColor } from '~/utils/chart'

interface Slice { name: string, value: number, color?: string }

const props = withDefaults(defineProps<{
  data: Slice[]
  size?: number
  thickness?: number
  /** Centre headline; falls back to the total. */
  centerLabel?: string
  centerValue?: string
  format?: (n: number) => string
}>(), { size: 200, thickness: 26, format: (n: number) => formatCompact(n) })

const total = computed(() => props.data.reduce((a, s) => a + s.value, 0))

const R = computed(() => props.size / 2)
const r = computed(() => R.value - props.thickness / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const GAP_DEG = 1.5 // surface gap between segments

const segments = computed(() => {
  let offset = 0
  return props.data.map((s, i) => {
    const frac = total.value ? s.value / total.value : 0
    const deg = frac * 360
    const seg = {
      key: s.name,
      color: s.color ?? slotColor(i),
      value: s.value,
      name: s.name,
      pct: frac * 100,
      dash: Math.max(0, (frac * circ.value) - (GAP_DEG / 360) * circ.value),
      offset: -(offset / 360) * circ.value,
    }
    offset += deg
    return seg
  })
})

const hover = ref<string | null>(null)
const hovered = computed(() => segments.value.find(s => s.key === hover.value) ?? null)

const root = useTemplateRef<SVGElement>('root')
onMounted(() => {
  if (!root.value)
    return
  const segs = root.value.querySelectorAll('[data-seg]')
  if (!segs.length)
    return
  gsap.from(segs, {
    strokeDasharray: `0 ${circ.value}`,
    duration: 0.9,
    ease: 'power2.out',
    stagger: 0.07,
  })
})
</script>

<template>
  <div class="relative inline-grid place-items-center">
    <svg
      ref="root"
      :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`"
      role="img" :aria-label="`Donut chart, total ${format(total)}`"
      class="-rotate-90"
    >
      <circle
        :cx="R" :cy="R" :r="r"
        fill="none" stroke="var(--chart-grid)" :stroke-width="thickness"
      />
      <circle
        v-for="s in segments" :key="s.key"
        data-seg
        :cx="R" :cy="R" :r="r"
        fill="none"
        :stroke="s.color"
        :stroke-width="hover === s.key ? thickness + 4 : thickness"
        :stroke-dasharray="`${s.dash} ${circ - s.dash}`"
        :stroke-dashoffset="s.offset"
        stroke-linecap="butt"
        class="transition-[stroke-width,opacity] duration-150"
        :opacity="hover && hover !== s.key ? 0.45 : 1"
        @pointerenter="hover = s.key"
        @pointerleave="hover = null"
      />
    </svg>

    <div class="pointer-events-none absolute text-center">
      <p class="text-xl font-semibold tabular-nums text-[var(--text-strong)]">
        {{ hovered ? format(hovered.value) : (centerValue ?? format(total)) }}
      </p>
      <p class="mt-0.5 text-xs text-[var(--text-muted)]">
        {{ hovered ? hovered.name : (centerLabel ?? 'Total') }}
      </p>
    </div>
  </div>
</template>
