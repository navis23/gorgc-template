import type { MaybeRefOrGetter, Ref } from 'vue'

export type SortDirection = 'asc' | 'desc'

export interface UseCollectionOptions<T> {
  /** Fields a free-text query is matched against (stringified, case-insensitive). */
  searchFields?: Array<keyof T>
  /** Custom matcher. Overrides `searchFields` when given. */
  search?: (item: T, query: string) => boolean
  /**
   * Named predicates applied after search. Return true to keep an item.
   * Reactive sources are read through `toValue`, so refs work directly.
   */
  filters?: Record<string, (item: T) => boolean>
  initialSort?: (keyof T & string) | null
  initialDirection?: SortDirection
  /** Per-page size. Pass `0` to disable pagination. */
  pageSize?: number
  /** Custom comparator for a given key, for fields that don't sort naturally. */
  comparators?: Partial<Record<keyof T & string, (a: T, b: T) => number>>
}

export interface UseCollectionReturn<T> {
  query: Ref<string>
  sortKey: Ref<string | null>
  sortDirection: Ref<SortDirection>
  page: Ref<number>
  pageSize: Ref<number>
  /** After search + filters, before sort and pagination. */
  filtered: Ref<T[]>
  /** After sort, before pagination — the full result set. */
  sorted: Ref<T[]>
  /** The current page. Equals `sorted` when pagination is disabled. */
  visible: Ref<T[]>
  total: Ref<number>
  pageCount: Ref<number>
  isEmpty: Ref<boolean>
  isFiltered: Ref<boolean>
  toggleSort: (key: string) => void
  reset: () => void
}

function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number')
    return a - b
  if (a instanceof Date && b instanceof Date)
    return a.getTime() - b.getTime()
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return Number(a) - Number(b)
  return String(a ?? '').localeCompare(String(b ?? ''))
}

/**
 * Search + filter + sort + paginate for a list.
 *
 * Replaces the per-page copies of this logic — each of which had to re-implement
 * the "narrowing the results must send you back to page 1" rule independently,
 * which is the part that quietly goes wrong.
 */
export function useCollection<T extends Record<string, any>>(
  source: MaybeRefOrGetter<T[]>,
  options: UseCollectionOptions<T> = {},
): UseCollectionReturn<T> {
  const {
    searchFields = [],
    search,
    filters = {},
    initialSort = null,
    initialDirection = 'asc',
    pageSize: initialPageSize = 10,
  } = options

  // Destructuring with `= {}` widens this to `{}` and loses the key mapping.
  const comparators: NonNullable<UseCollectionOptions<T>['comparators']> = options.comparators ?? {}

  const query = ref('')
  const sortKey = ref<string | null>(initialSort)
  const sortDirection = ref<SortDirection>(initialDirection)
  const page = ref(1)
  const pageSize = ref(initialPageSize)

  const items = computed(() => toValue(source))

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    let list = items.value

    if (q) {
      list = list.filter((item) => {
        if (search)
          return search(item, q)
        if (!searchFields.length)
          return true
        return searchFields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
      })
    }

    for (const predicate of Object.values(filters))
      list = list.filter(predicate)

    return list
  })

  const sorted = computed(() => {
    const key = sortKey.value
    if (!key)
      return filtered.value

    const dir = sortDirection.value === 'asc' ? 1 : -1
    const custom = comparators[key as keyof T & string]
    // Copy before sorting — never mutate the caller's array.
    return [...filtered.value].sort((a, b) =>
      (custom ? custom(a, b) : defaultCompare(a[key], b[key])) * dir)
  })

  const total = computed(() => sorted.value.length)

  const pageCount = computed(() =>
    pageSize.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1)

  const visible = computed(() => {
    if (pageSize.value <= 0)
      return sorted.value
    const start = (page.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  const isEmpty = computed(() => total.value === 0)
  const isFiltered = computed(() => query.value.trim().length > 0)

  // Narrowing the result set must never strand the user on a page that no
  // longer exists — clamp instead of showing an empty table.
  watch([total, pageSize], () => {
    if (page.value > pageCount.value)
      page.value = pageCount.value
  })
  watch(query, () => { page.value = 1 })

  function toggleSort(key: string) {
    if (sortKey.value === key)
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    else {
      sortKey.value = key
      sortDirection.value = 'asc'
    }
  }

  function reset() {
    query.value = ''
    sortKey.value = initialSort
    sortDirection.value = initialDirection
    page.value = 1
  }

  return {
    query, sortKey, sortDirection, page, pageSize,
    filtered, sorted, visible, total, pageCount, isEmpty, isFiltered,
    toggleSort, reset,
  }
}
