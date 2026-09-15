<script setup lang="ts">
import { Primitive } from 'reka-ui'

type Variant = 'solid' | 'soft' | 'outline' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  block?: boolean
  pill?: boolean
  as?: string
  to?: string
}>(), {
  variant: 'solid',
  size: 'md',
  as: 'button',
})

const variants: Record<Variant, string> = {
  solid: 'bg-tide-600 text-white hover:bg-tide-700 active:bg-tide-800 shadow-raise',
  soft: 'bg-tide-100 text-tide-800 hover:bg-tide-200 dark:bg-tide-900/40 dark:text-tide-100 dark:hover:bg-tide-900/70',
  // ink-800 on an ink-950 page is too faint to read as an edge; lift the border in dark.
  outline: 'border border-[var(--surface-border)] dark:border-ink-700 text-[var(--text-strong)] hover:bg-[var(--surface-sunken)] dark:hover:border-ink-600',
  ghost: 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]',
  danger: 'bg-[var(--color-critical)] text-white hover:brightness-110 active:brightness-95 shadow-raise',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const el = computed(() => (props.to ? resolveComponent('NuxtLink') : props.as))
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <Primitive
    :as="el"
    :to="to"
    :disabled="as === 'button' ? isDisabled : undefined"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center font-medium whitespace-nowrap select-none
           transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-snap)
           active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    :class="[
      variants[variant],
      sizes[size],
      pill ? 'rounded-pill' : 'rounded-field',
      block && 'w-full',
    ]"
  >
    <Icon v-if="loading" name="lucide:loader-circle" class="size-4 animate-spin" />
    <slot v-else name="lead" />
    <slot />
    <slot name="trail" />
  </Primitive>
</template>
