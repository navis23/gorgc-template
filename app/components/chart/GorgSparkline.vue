<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { gsap } from 'gsap'
import { slotColor, smoothPath } from '~/utils/chart'

const props = withDefaults(defineProps<{
  data: number[]
  /** Fixed width in px. Omit to fill the container (the usual case). */
  width?: number
  height?: number
  color?: string
  area?: boolean
  /** Colour by direction instead of a fixed slot. */
  tone?: boolean
}>(), { height: 36, area: true })

const wrap = useTemplateRef<HTMLElement>('wrap')
const { width: measured } = useElementSize(wrap)

// Fluid by default; an explicit `width` still wins for fixed-size callers.
// useElementSize reports 0 on the server, so SSR draws at the fallback width
// while the client draws at the measured one — the SVG geometry differs and Vue
// reports a hydration mismatch. Hold the fallback for the first client render so
// both sides agree, then adopt the real measurement on the next tick.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const w = computed(() => props.width ?? (mounted.value ? Math.max(40, Math.round(measured.value) || 160) : 160))

const stroke = computed(() => {
  if (props.color)
    return props.color
  if (!props.tone)
    return slotColor(0)
  const first = props.data[0] ?? 0
  const last = props.data.at(-1) ?? 0
  return last >= first ? 'var(--color-positive)' : 'var(--color-critical)'
})

const geo = computed(() => {
  const d = props.data
  if (d.length < 2)
    return { line: '', fill: '' }
  const min = Math.min(...d)
  const max = Math.max(...d)
  const pad = 3
  const pts = d.map((v, i) => ({
    x: (i / (d.length - 1)) * w.value,
    y: pad + (1 - (max === min ? 0.5 : (v - min) / (max - min))) * (props.height - pad * 2),
  }))
  const line = smoothPath(pts)
  return { line, fill: `${line} L${w.value},${props.height} L0,${props.height} Z` }
})

const el = useTemplateRef<SVGPathElement>('el')
onMounted(() => {
  if (!el.value)
    return
  const len = el.value.getTotalLength()
  if (!len)
    return
  gsap.fromTo(el.value,
    { strokeDasharray: len, strokeDashoffset: len },
    {
      strokeDashoffset: 0,
      duration: 0.9,
      ease: 'power2.out',
      // Always land on a fully drawn line, even if the tween is cut short.
      clearProps: 'strokeDasharray,strokeDashoffset',
      onInterrupt: () => gsap.set(el.value!, { clearProps: 'strokeDasharray,strokeDashoffset' }),
    },
  )
})
</script>

<template>
  <div ref="wrap" class="w-full">
    <svg
      :width="w" :height="height" :viewBox="`0 0 ${w} ${height}`"
      class="block w-full overflow-visible" aria-hidden="true" focusable="false"
    >
      <path v-if="area" :d="geo.fill" :fill="stroke" opacity="0.12" />
      <path
        ref="el" :d="geo.line" fill="none" :stroke="stroke"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
    </svg>
  </div>
</template>
