<script setup lang="ts">
type Align = 'start' | 'center' | 'end'
type Direction = 'asc' | 'desc'

const props = withDefaults(defineProps<{
  align?: Align
  /** Any CSS width — `12rem`, `25%`, `1px`. */
  width?: string
  sortable?: boolean
  /** Current direction when this column is the active sort, otherwise `false`. */
  sorted?: false | Direction
  compact?: boolean
  sticky?: boolean
}>(), {
  align: 'start',
  sorted: false,
})

const emit = defineEmits<{
  sort: []
}>()

const alignment: Record<Align, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
}

const justify: Record<Align, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

const ariaSort = computed(() => {
  if (!props.sortable)
    return undefined
  if (props.sorted === 'asc')
    return 'ascending' as const
  if (props.sorted === 'desc')
    return 'descending' as const
  return 'none' as const
})

const sortIcon = computed(() => {
  if (props.sorted === 'asc')
    return 'lucide:arrow-up'
  if (props.sorted === 'desc')
    return 'lucide:arrow-down'
  return 'lucide:chevrons-up-down'
})
</script>

<template>
  <th
    scope="col"
    :style="width ? { width } : undefined"
    :aria-sort="ariaSort"
    class="border-b border-[var(--surface-border)] bg-[var(--surface-sunken)] text-xs font-semibold uppercase
           tracking-wide text-[var(--text-muted)]"
    :class="[
      alignment[align],
      compact ? 'px-3 py-2' : 'px-4 py-3',
      sticky && 'sticky top-0 z-10',
    ]"
  >
    <button
      v-if="sortable"
      type="button"
      class="inline-flex w-full items-center gap-1.5 rounded-field text-xs font-semibold uppercase tracking-wide
             transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]"
      :class="[justify[align], sorted && 'text-[var(--text-strong)]']"
      @click="emit('sort')"
    >
      <span class="truncate"><slot /></span>
      <Icon
        :name="sortIcon"
        class="size-3.5 shrink-0 transition-opacity duration-(--duration-snap)"
        :class="sorted ? 'opacity-100 text-tide-600' : 'opacity-50'"
        aria-hidden="true"
      />
    </button>

    <span v-else class="block truncate"><slot /></span>
  </th>
</template>
