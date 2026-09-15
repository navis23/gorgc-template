<script setup lang="ts">
type Variant = 'text' | 'circle' | 'rect'

const props = withDefaults(defineProps<{
  variant?: Variant
  /** Number of bars drawn for the `text` variant. */
  lines?: number
  /** Any CSS width — defaults to filling the container. */
  width?: string
  /** Any CSS height — overrides the variant default. */
  height?: string
  /** Diameter for the `circle` variant, e.g. `2.5rem`. */
  size?: string
  rounded?: 'field' | 'card' | 'pill'
}>(), {
  variant: 'text',
  lines: 1,
  rounded: 'field',
})

const shimmer = 'animate-pulse bg-linear-to-r from-[var(--surface-sunken)] via-[var(--surface-border)] '
  + 'to-[var(--surface-sunken)]'

const radii: Record<'field' | 'card' | 'pill', string> = {
  field: 'rounded-field',
  card: 'rounded-card',
  pill: 'rounded-pill',
}

const count = computed(() => Math.max(1, Math.round(props.lines)))

/** The closing bar of a paragraph reads better short. */
function lineWidth(index: number) {
  if (props.width)
    return props.width
  if (count.value > 1 && index === count.value - 1)
    return '62%'
  return '100%'
}
</script>

<template>
  <span
    v-if="variant === 'circle'"
    class="block shrink-0 rounded-pill"
    :class="shimmer"
    :style="{ width: size ?? width ?? '2.5rem', height: size ?? height ?? '2.5rem' }"
    aria-hidden="true"
  />

  <span
    v-else-if="variant === 'rect'"
    class="block"
    :class="[shimmer, radii[rounded]]"
    :style="{ width: width ?? '100%', height: height ?? '6rem' }"
    aria-hidden="true"
  />

  <span v-else class="flex w-full flex-col gap-2" aria-hidden="true">
    <span
      v-for="index in count"
      :key="index"
      class="block rounded-pill"
      :class="shimmer"
      :style="{ width: lineWidth(index - 1), height: height ?? '0.75rem' }"
    />
  </span>
</template>
