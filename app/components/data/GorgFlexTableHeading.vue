<script setup lang="ts">
type Align = 'start' | 'center' | 'end'
type Direction = 'asc' | 'desc'

const props = withDefaults(defineProps<{
  align?: Align
  /** Flex basis, e.g. `12rem` or `25%`. */
  width?: string
  fixed?: boolean
  sortable?: boolean
  /** Current direction when this column is the active sort, otherwise `false`. */
  sorted?: false | Direction
}>(), {
  align: 'start',
  sorted: false,
})

const emit = defineEmits<{
  sort: []
}>()

const alignment: Record<Align, string> = {
  start: 'text-start justify-start',
  center: 'text-center justify-center',
  end: 'text-end justify-end',
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
  <div
    role="columnheader"
    :aria-sort="ariaSort"
    class="flex min-w-0 items-center"
    :class="[alignment[align], fixed ? 'flex-none' : 'flex-1']"
    :style="width ? { flexBasis: width } : undefined"
  >
    <button
      v-if="sortable"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-field transition-colors duration-(--duration-snap)
             hover:text-[var(--text-strong)]"
      :class="sorted && 'text-[var(--text-strong)]'"
      @click="emit('sort')"
    >
      <span class="truncate"><slot /></span>
      <Icon
        :name="sortIcon"
        class="size-3.5 shrink-0"
        :class="sorted ? 'text-tide-600 opacity-100' : 'opacity-50'"
        aria-hidden="true"
      />
    </button>

    <span v-else class="truncate"><slot /></span>
  </div>
</template>
