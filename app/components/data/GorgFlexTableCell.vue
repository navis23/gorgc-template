<script setup lang="ts">
type Align = 'start' | 'center' | 'end'

withDefaults(defineProps<{
  align?: Align
  /** Flex basis, e.g. `12rem` or `25%`. */
  width?: string
  /** Stop the cell from absorbing spare space. */
  fixed?: boolean
  nowrap?: boolean
  /** Column name echoed beside the value while the table is stacked. */
  label?: string
}>(), {
  align: 'start',
})

const alignment: Record<Align, string> = {
  start: 'md:text-start md:justify-start',
  center: 'md:text-center md:justify-center',
  end: 'md:text-end md:justify-end',
}
</script>

<template>
  <div
    role="cell"
    class="flex min-w-0 items-center justify-between gap-3 text-sm text-[var(--text-strong)]"
    :class="[
      alignment[align],
      fixed ? 'md:flex-none' : 'md:flex-1',
      nowrap && 'md:whitespace-nowrap',
      width && 'md:basis-(--cell-basis)',
    ]"
    :style="width ? { '--cell-basis': width } : undefined"
  >
    <span v-if="label" class="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] md:hidden">
      {{ label }}
    </span>

    <span class="min-w-0 truncate">
      <slot />
    </span>
  </div>
</template>
