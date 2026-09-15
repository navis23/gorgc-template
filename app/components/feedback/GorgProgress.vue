<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  value?: number
  max?: number
  tone?: 'brand' | 'accent' | 'positive' | 'caution' | 'critical'
  size?: 'xs' | 'sm' | 'md'
  showValue?: boolean
  label?: string
  indeterminate?: boolean
}>(), { value: 0, max: 100, tone: 'brand', size: 'sm' })

const tones = {
  brand: 'bg-tide-500',
  accent: 'bg-ember-500',
  positive: 'bg-[var(--color-positive)]',
  caution: 'bg-[var(--color-caution)]',
  critical: 'bg-[var(--color-critical)]',
}

const sizes = { xs: 'h-1', sm: 'h-2', md: 'h-3' }

// Tween the fill rather than letting it snap between values.
const shown = ref(0)
watch(() => props.value, (v) => {
  const proxy = { n: shown.value }
  gsap.to(proxy, {
    n: v,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => { shown.value = proxy.n },
  })
}, { immediate: true })

const pct = computed(() => Math.min(100, Math.max(0, (shown.value / props.max) * 100)))
</script>

<template>
  <div>
    <div v-if="label || showValue" class="mb-1.5 flex items-center justify-between gap-2 text-xs">
      <span v-if="label" class="font-medium text-[var(--text-strong)]">{{ label }}</span>
      <span v-if="showValue" class="tabular-nums text-[var(--text-muted)]">{{ Math.round(pct) }}%</span>
    </div>

    <ProgressRoot
      :model-value="indeterminate ? null : value"
      :max="max"
      class="relative w-full overflow-hidden rounded-pill bg-[var(--surface-sunken)]"
      :class="sizes[size]"
    >
      <ProgressIndicator
        class="size-full rounded-pill transition-none"
        :class="[tones[tone], indeterminate && 'animate-pulse']"
        :style="indeterminate ? undefined : { transform: `translateX(-${100 - pct}%)` }"
      />
    </ProgressRoot>
  </div>
</template>
