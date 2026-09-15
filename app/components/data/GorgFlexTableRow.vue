<script setup lang="ts">
import type { ComputedRef } from 'vue'

interface FlexTableContext {
  striped: ComputedRef<boolean>
  hoverable: ComputedRef<boolean>
  compact: ComputedRef<boolean>
}

const props = withDefaults(defineProps<{
  /** Heading row: no card chrome, and hidden while the table is stacked. */
  header?: boolean
  selected?: boolean
  interactive?: boolean
  hoverable?: boolean
  compact?: boolean
}>(), {})

const table = inject<FlexTableContext | null>('gorg-flex-table', null)

const isCompact = computed(() => props.compact ?? table?.compact.value ?? false)
const isHoverable = computed(() => !props.header && (props.hoverable ?? table?.hoverable.value ?? false))
const isStriped = computed(() => !props.header && table?.striped.value === true)
</script>

<template>
  <div
    v-if="header"
    role="row"
    class="hidden items-center gap-4 px-4 text-xs font-semibold uppercase tracking-wide
           text-[var(--text-muted)] md:flex"
    :class="isCompact ? 'py-1.5' : 'py-2'"
  >
    <slot />
  </div>

  <div
    v-else
    role="row"
    :aria-selected="selected || undefined"
    class="flex flex-col gap-2 rounded-card border bg-[var(--surface-raised)] shadow-raise
           transition-[border-color,background-color,box-shadow,transform] duration-(--duration-base)
           md:flex-row md:items-center md:gap-4"
    :class="[
      isCompact ? 'px-3 py-2.5' : 'px-4 py-3.5',
      isStriped && 'even:bg-[var(--surface-sunken)]/60',
      isHoverable && 'hover:border-tide-300 hover:shadow-float dark:hover:border-tide-800',
      selected ? 'border-tide-500 bg-tide-50/60 dark:bg-tide-900/25' : 'border-[var(--surface-border)]',
      interactive && 'cursor-pointer',
    ]"
  >
    <slot />
  </div>
</template>
