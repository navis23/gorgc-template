<script setup lang="ts">
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  value: number
  min?: number
  max?: number
  size?: number
  thickness?: number
  label?: string
  /** Status tone overrides the brand slot — reserved for real state, not series identity. */
  status?: 'good' | 'warning' | 'serious' | 'critical'
  format?: (n: number) => string
}>(), {
  min: 0, max: 100, size: 160, thickness: 14,
  format: (n: number) => `${Math.round(n)}%`,
})

const SWEEP = 240 // degrees of arc; leaves a 120° gap at the bottom

const statusColor = {
  good: 'var(--color-positive)',
  warning: 'var(--color-caution)',
  serious: 'var(--color-caution)',
  critical: 'var(--color-critical)',
}

const color = computed(() => (props.status ? statusColor[props.status] : 'var(--chart-1)'))

const R = computed(() => props.size / 2)
const r = computed(() => R.value - props.thickness / 2 - 2)
const circ = computed(() => 2 * Math.PI * r.value)
const arcLen = computed(() => (SWEEP / 360) * circ.value)

const shown = ref(props.min)
watch(() => props.value, (v) => {
  const p = { n: shown.value }
  gsap.to(p, { n: v, duration: 1, ease: 'power2.out', onUpdate: () => { shown.value = p.n } })
}, { immediate: true })

const frac = computed(() => {
  const t = (shown.value - props.min) / Math.max(1e-9, props.max - props.min)
  return Math.min(1, Math.max(0, t))
})
</script>

<template>
  <div class="relative inline-grid place-items-center">
    <svg
      :width="size" :height="size * 0.78" :viewBox="`0 0 ${size} ${size * 0.78}`"
      role="img" :aria-label="`${label ?? 'Gauge'}: ${format(value)}`"
    >
      <g :transform="`rotate(150 ${R} ${R})`">
        <circle
          :cx="R" :cy="R" :r="r" fill="none"
          stroke="var(--chart-grid)" :stroke-width="thickness"
          :stroke-dasharray="`${arcLen} ${circ}`" stroke-linecap="round"
        />
        <circle
          :cx="R" :cy="R" :r="r" fill="none"
          :stroke="color" :stroke-width="thickness"
          :stroke-dasharray="`${arcLen * frac} ${circ}`" stroke-linecap="round"
        />
      </g>
    </svg>

    <div class="pointer-events-none absolute bottom-1 text-center">
      <p class="text-2xl font-semibold tabular-nums text-[var(--text-strong)]">{{ format(shown) }}</p>
      <p v-if="label" class="mt-0.5 text-xs text-[var(--text-muted)]">{{ label }}</p>
    </div>
  </div>
</template>
