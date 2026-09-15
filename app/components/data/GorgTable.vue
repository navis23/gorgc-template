<script setup lang="ts">
import { useStagger } from '~/composables/useMotion'

type Align = 'start' | 'center' | 'end'
type Direction = 'asc' | 'desc'

interface Column {
  key: string
  label: string
  align?: Align
  /** Any CSS width — `12rem`, `25%`. */
  width?: string
  sortable?: boolean
  nowrap?: boolean
}

type Row = Record<string, any>

const props = withDefaults(defineProps<{
  columns?: Column[]
  rows?: Row[]
  loading?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  /** Field used for `:key` on each row. Falls back to the index. */
  rowKey?: string
  /** Number of placeholder rows drawn while `loading`. */
  skeletonRows?: number
  stickyHeader?: boolean
  caption?: string
}>(), {
  columns: () => [],
  rows: () => [],
  hoverable: true,
  skeletonRows: 5,
})

const emit = defineEmits<{
  sort: [payload: { key: string, direction: Direction }]
  rowClick: [row: Row, index: number]
}>()

const sortKey = defineModel<string | null>('sortKey', { default: null })
const sortDirection = defineModel<Direction>('sortDirection', { default: 'asc' })

const body = ref<HTMLElement | null>(null)
useStagger(body, { selector: ':scope > tr', each: 0.04, y: 12 })

const isEmpty = computed(() => !props.loading && props.rows.length === 0)
const columnCount = computed(() => props.columns.length || 1)

function sortedState(key: string): false | Direction {
  return sortKey.value === key ? sortDirection.value : false
}

function toggleSort(column: Column) {
  if (!column.sortable)
    return

  if (sortKey.value === column.key)
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = column.key
    sortDirection.value = 'asc'
  }

  emit('sort', { key: column.key, direction: sortDirection.value })
}

function keyFor(row: Row, index: number) {
  const value = props.rowKey ? row[props.rowKey] : undefined
  return value === undefined || value === null ? index : String(value)
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '')
    return '—'
  return String(value)
}
</script>

<template>
  <div class="w-full overflow-x-auto rounded-card border border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-raise">
    <table class="w-full border-collapse text-start" :aria-busy="loading || undefined">
      <caption v-if="caption || $slots.caption" class="px-4 py-3 text-start text-sm text-[var(--text-muted)]">
        <slot name="caption">{{ caption }}</slot>
      </caption>

      <thead>
        <tr>
          <GorgTableHeading
            v-for="column in columns"
            :key="column.key"
            :align="column.align"
            :width="column.width"
            :sortable="column.sortable"
            :sorted="sortedState(column.key)"
            :compact="compact"
            :sticky="stickyHeader"
            @sort="toggleSort(column)"
          >
            <slot :name="`header-${column.key}`" :column="column">{{ column.label }}</slot>
          </GorgTableHeading>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr
          v-for="row in skeletonRows"
          :key="`skeleton-${row}`"
          class="border-b border-[var(--surface-border)] last:border-b-0"
        >
          <GorgTableCell
            v-for="column in columns"
            :key="column.key"
            :align="column.align"
            :compact="compact"
          >
            <GorgSkeleton variant="text" :lines="1" />
          </GorgTableCell>
        </tr>
      </tbody>

      <tbody v-else-if="isEmpty">
        <tr>
          <GorgTableCell :colspan="columnCount" align="center" class="py-0">
            <slot name="empty">
              <GorgEmptyState
                icon="lucide:inbox"
                title="Nothing here yet"
                description="Once there is data to show, it will appear in this table."
              />
            </slot>
          </GorgTableCell>
        </tr>
      </tbody>

      <tbody v-else ref="body">
        <GorgTableRow
          v-for="(row, index) in rows"
          :key="keyFor(row, index)"
          :striped="striped"
          :hoverable="hoverable"
          @click="emit('rowClick', row, index)"
        >
          <GorgTableCell
            v-for="column in columns"
            :key="column.key"
            :align="column.align"
            :compact="compact"
            :nowrap="column.nowrap"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
              {{ display(row[column.key]) }}
            </slot>
          </GorgTableCell>
        </GorgTableRow>
      </tbody>
    </table>
  </div>
</template>
