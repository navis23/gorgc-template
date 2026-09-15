<script setup lang="ts">
withDefaults(defineProps<{
  hoverable?: boolean
  striped?: boolean
  selected?: boolean
  /** Adds a pointer cursor — pair it with a click handler on the row. */
  interactive?: boolean
}>(), {})
</script>

<template>
  <tr
    :aria-selected="selected || undefined"
    class="border-b border-[var(--surface-border)] transition-colors duration-(--duration-snap) last:border-b-0"
    :class="[
      striped && 'odd:bg-[var(--surface-sunken)]/60',
      hoverable && 'hover:bg-tide-50/70 dark:hover:bg-tide-900/20',
      selected && 'bg-tide-50 dark:bg-tide-900/30',
      interactive && 'cursor-pointer',
    ]"
  >
    <slot />
  </tr>
</template>
