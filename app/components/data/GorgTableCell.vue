<script setup lang="ts">
type Align = 'start' | 'center' | 'end'

withDefaults(defineProps<{
  align?: Align
  compact?: boolean
  nowrap?: boolean
  /** Renders a `<th scope="row">` instead of a `<td>`. */
  header?: boolean
  colspan?: number
}>(), {
  align: 'start',
})

const alignment: Record<Align, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
}
</script>

<template>
  <component
    :is="header ? 'th' : 'td'"
    :scope="header ? 'row' : undefined"
    :colspan="colspan"
    class="align-middle text-sm text-[var(--text-strong)]"
    :class="[
      alignment[align],
      compact ? 'px-3 py-2' : 'px-4 py-3',
      nowrap && 'whitespace-nowrap',
      header && 'font-semibold',
    ]"
  >
    <slot />
  </component>
</template>
