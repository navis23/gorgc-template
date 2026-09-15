<script setup lang="ts">
type Tone = 'neutral' | 'brand' | 'accent' | 'positive' | 'caution' | 'critical' | 'info'

withDefaults(defineProps<{
  tone?: Tone
  variant?: 'soft' | 'solid' | 'outline'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
}>(), { tone: 'neutral', variant: 'soft', size: 'sm' })

const soft: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]',
  brand: 'bg-tide-100 text-tide-800 dark:bg-tide-900/50 dark:text-tide-200',
  accent: 'bg-ember-100 text-ember-800 dark:bg-ember-900/50 dark:text-ember-200',
  positive: 'bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]',
  caution: 'bg-[color-mix(in_oklch,var(--color-caution)_20%,transparent)] text-[var(--color-caution)]',
  critical: 'bg-[color-mix(in_oklch,var(--color-critical)_15%,transparent)] text-[var(--color-critical)]',
  info: 'bg-[color-mix(in_oklch,var(--color-info)_15%,transparent)] text-[var(--color-info)]',
}

const solid: Record<Tone, string> = {
  neutral: 'bg-ink-600 text-white',
  brand: 'bg-tide-600 text-white',
  accent: 'bg-ember-600 text-white',
  positive: 'bg-[var(--color-positive)] text-white',
  caution: 'bg-[var(--color-caution)] text-ink-950',
  critical: 'bg-[var(--color-critical)] text-white',
  info: 'bg-[var(--color-info)] text-white',
}

const dotTone: Record<Tone, string> = {
  neutral: 'bg-ink-400', brand: 'bg-tide-500', accent: 'bg-ember-500',
  positive: 'bg-[var(--color-positive)]', caution: 'bg-[var(--color-caution)]',
  critical: 'bg-[var(--color-critical)]', info: 'bg-[var(--color-info)]',
}

const sizes = {
  xs: 'h-5 px-1.5 text-[10px] gap-1',
  sm: 'h-6 px-2 text-xs gap-1.5',
  md: 'h-7 px-2.5 text-sm gap-1.5',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-pill font-medium whitespace-nowrap"
    :class="[
      sizes[size],
      variant === 'soft' && soft[tone],
      variant === 'solid' && solid[tone],
      variant === 'outline' && 'border border-[var(--surface-border)] text-[var(--text-muted)]',
    ]"
  >
    <span v-if="dot" class="size-1.5 rounded-pill" :class="dotTone[tone]" />
    <slot />
  </span>
</template>
