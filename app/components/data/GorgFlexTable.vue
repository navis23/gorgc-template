<script setup lang="ts">
import type { ComputedRef } from 'vue'

/**
 * Div-based counterpart to GorgTable: each row is its own card, and the
 * whole thing folds into a stack of cards below the `md` breakpoint.
 */
const props = withDefaults(defineProps<{
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  /** Accessible name — required when there is no visible heading row. */
  label?: string
}>(), {
  hoverable: true,
})

interface FlexTableContext {
  striped: ComputedRef<boolean>
  hoverable: ComputedRef<boolean>
  compact: ComputedRef<boolean>
}

provide<FlexTableContext>('gorg-flex-table', {
  striped: computed(() => props.striped === true),
  hoverable: computed(() => props.hoverable === true),
  compact: computed(() => props.compact === true),
})
</script>

<template>
  <div role="table" :aria-label="label" class="flex w-full flex-col gap-2">
    <slot />
  </div>
</template>
