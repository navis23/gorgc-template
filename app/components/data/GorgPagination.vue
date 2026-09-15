<script setup lang="ts">
import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  /** Total number of records across every page. */
  total?: number
  pageSizes?: number[]
  siblingCount?: number
  showEdges?: boolean
  disabled?: boolean
  /** Hide the "showing 1–10 of 240" line. */
  hideSummary?: boolean
  /** Hide the rows-per-page selector. */
  hidePageSize?: boolean
  /** Word used in the summary line, e.g. "orders". */
  unit?: string
  label?: string
}>(), {
  total: 0,
  pageSizes: () => [10, 25, 50, 100],
  siblingCount: 1,
  showEdges: true,
  unit: 'results',
  label: 'Pagination',
})

const emit = defineEmits<{
  change: [payload: { page: number, pageSize: number }]
}>()

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

const pageSizeItems = computed(() => props.pageSizes.map(size => ({ label: `${size} / page`, value: size })))

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / Math.max(1, pageSize.value))))
const firstRow = computed(() => (props.total === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const lastRow = computed(() => Math.min(page.value * pageSize.value, props.total))

const selectedSize = computed<string | number | null | undefined>({
  get: () => pageSize.value,
  set: (value) => {
    if (value === null || value === undefined)
      return
    const next = Number(value)
    pageSize.value = next
    page.value = 1
    emit('change', { page: 1, pageSize: next })
  },
})

function onPageChange(value: number) {
  emit('change', { page: value, pageSize: pageSize.value })
}

const control = 'grid size-9 place-items-center rounded-field border border-[var(--surface-border)] '
  + 'bg-[var(--surface-raised)] text-[var(--text-muted)] transition-colors duration-(--duration-snap) '
  + 'hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] '
  + 'disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
  <PaginationRoot
    v-model:page="page"
    :items-per-page="pageSize"
    :total="total"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    :disabled="disabled"
    as="nav"
    @update:page="onPageChange"
    :aria-label="label"
    class="flex flex-wrap items-center justify-between gap-4"
  >
    <p v-if="!hideSummary" class="text-sm text-[var(--text-muted)]" aria-live="polite">
      <slot name="summary" :first="firstRow" :last="lastRow" :total="total">
        Showing
        <span class="font-mono font-medium tabular-nums text-[var(--text-strong)]">{{ firstRow }}–{{ lastRow }}</span>
        of
        <span class="font-mono font-medium tabular-nums text-[var(--text-strong)]">{{ total }}</span>
        {{ unit }}
      </slot>
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <div v-if="!hidePageSize" class="w-32">
        <GorgSelect
          v-model="selectedSize"
          :items="pageSizeItems"
          size="sm"
          :disabled="disabled"
          placeholder="Rows"
        />
      </div>

      <div class="flex items-center gap-1">
        <PaginationFirst v-if="showEdges" :class="control" aria-label="First page">
          <Icon name="lucide:chevrons-left" class="size-4" aria-hidden="true" />
        </PaginationFirst>

        <PaginationPrev :class="control" aria-label="Previous page">
          <Icon name="lucide:chevron-left" class="size-4" aria-hidden="true" />
        </PaginationPrev>

        <PaginationList v-slot="{ items }" class="flex items-center gap-1">
          <template v-for="(item, index) in items">
            <PaginationListItem
              v-if="item.type === 'page'"
              :key="`page-${item.value}`"
              :value="item.value"
              :aria-current="item.value === page ? 'page' : undefined"
              class="grid size-9 place-items-center rounded-field border border-[var(--surface-border)]
                     bg-[var(--surface-raised)] font-mono text-sm tabular-nums text-[var(--text-strong)]
                     transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]
                     data-[selected]:border-tide-600 data-[selected]:bg-tide-600 data-[selected]:text-white
                     data-[selected]:shadow-raise"
            >
              {{ item.value }}
            </PaginationListItem>

            <PaginationEllipsis
              v-else
              :key="`ellipsis-${index}`"
              class="grid size-9 place-items-center text-[var(--text-muted)]"
            >
              <Icon name="lucide:ellipsis" class="size-4" aria-hidden="true" />
            </PaginationEllipsis>
          </template>
        </PaginationList>

        <PaginationNext :class="control" aria-label="Next page">
          <Icon name="lucide:chevron-right" class="size-4" aria-hidden="true" />
        </PaginationNext>

        <PaginationLast v-if="showEdges" :class="control" aria-label="Last page">
          <Icon name="lucide:chevrons-right" class="size-4" aria-hidden="true" />
        </PaginationLast>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">
      Page {{ page }} of {{ pageCount }}
    </p>
  </PaginationRoot>
</template>
