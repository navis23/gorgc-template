<script setup lang="ts">
import type { ResultKind, SearchResult } from '~/utils/mock-utility'
import { resultKindMeta, searchResults } from '~/utils/mock-utility'

useHead({ title: 'Search' })

const kinds = Object.keys(resultKindMeta) as ResultKind[]
const activeKind = ref<'all' | ResultKind>('all')

/** One matcher, shared by the result list and the facet counts. */
function matchesQuery(r: SearchResult, q: string) {
  return r.title.toLowerCase().includes(q)
    || r.snippet.toLowerCase().includes(q)
    || r.meta.toLowerCase().includes(q)
}

const { query, sortKey, visible } = useCollection(searchResults, {
  search: matchesQuery,
  filters: {
    // Read through the ref so the facet nav keeps narrowing the results.
    kind: r => activeKind.value === 'all' || r.kind === activeKind.value,
  },
  // Relevance means score high-to-low, so the comparator carries the
  // direction and the control only ever swaps the key.
  comparators: {
    score: (a, b) => b.score - a.score,
    title: (a, b) => a.title.localeCompare(b.title),
  },
  initialSort: 'score',
  pageSize: 0,
})

// The page opens on a worked example.
query.value = 'rate limiter'

const sortItems = [
  { value: 'score', label: 'Relevance' },
  { value: 'title', label: 'Title' },
]

const sort = computed({
  get: () => sortKey.value ?? 'score',
  set: (value: string) => { sortKey.value = value },
})

/** Facet counts ignore the kind filter — they count what the query matched. */
const matched = computed(() => {
  const q = query.value.trim().toLowerCase()
  return searchResults.filter(r => !q || matchesQuery(r, q))
})

const counts = computed(() => {
  const map = {} as Record<ResultKind, number>
  for (const k of kinds)
    map[k] = matched.value.filter(r => r.kind === k).length
  return map
})

/** Wrap matches in <mark> without using v-html on raw input. */
function segments(text: string) {
  const q = query.value.trim()
  if (!q)
    return [{ text, hit: false }]
  const out: Array<{ text: string, hit: boolean }> = []
  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  let i = 0
  while (i < text.length) {
    const at = lower.indexOf(needle, i)
    if (at === -1) {
      out.push({ text: text.slice(i), hit: false })
      break
    }
    if (at > i)
      out.push({ text: text.slice(i, at), hit: false })
    out.push({ text: text.slice(at, at + needle.length), hit: true })
    i = at + needle.length
  }
  return out
}

const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.05, y: 10 })
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Search</h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        <template v-if="query.trim()">
          {{ visible.length }} {{ visible.length === 1 ? 'result' : 'results' }} for
          <span class="font-medium text-[var(--text-strong)]">“{{ query }}”</span>
        </template>
        <template v-else>Type to search across people, projects, documents and tasks.</template>
      </p>
    </header>

    <GorgInput
      v-model="query"
      placeholder="Search everything…"
      icon="lucide:search"
      size="lg"
      clearable
      type="search"
      aria-label="Search"
    />

    <div class="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <!-- facets -->
      <nav aria-label="Filter results by type">
        <ul class="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2 whitespace-nowrap rounded-field px-3 py-2 text-sm transition"
              :class="activeKind === 'all' ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="activeKind === 'all'"
              @click="activeKind = 'all'"
            >
              <Icon name="lucide:layers" class="size-4" />
              Everything
              <span class="ms-auto text-xs tabular-nums">{{ matched.length }}</span>
            </button>
          </li>
          <li v-for="k in kinds" :key="k">
            <button
              type="button"
              class="flex w-full items-center gap-2 whitespace-nowrap rounded-field px-3 py-2 text-sm transition disabled:opacity-40"
              :class="activeKind === k ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="activeKind === k"
              :disabled="!counts[k]"
              @click="activeKind = k"
            >
              <Icon :name="resultKindMeta[k].icon" class="size-4" />
              {{ resultKindMeta[k].label }}
              <span class="ms-auto text-xs tabular-nums">{{ counts[k] }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <div class="min-w-0 space-y-3">
        <div v-if="visible.length" class="flex items-center gap-2">
          <span class="text-xs text-[var(--text-muted)]">Sort</span>
          <GorgSegmented
            v-model="sort"
            :items="sortItems"
            variant="outline"
            aria-label="Sort order"
          />
        </div>

        <ul v-if="visible.length" ref="list" class="space-y-3">
          <li v-for="r in visible" :key="r.id">
            <article class="surface-card p-4 shadow-raise transition-[box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:shadow-float">
              <div class="flex items-start gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                  <Icon :name="resultKindMeta[r.kind].icon" class="size-4.5" />
                </span>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline gap-2">
                    <h2 class="text-sm font-semibold text-[var(--text-strong)]">
                      <span v-for="(seg, i) in segments(r.title)" :key="i">
                        <mark v-if="seg.hit" class="rounded-[3px] bg-ember-200 px-0.5 text-ember-950 dark:bg-ember-900 dark:text-ember-50">{{ seg.text }}</mark>
                        <template v-else>{{ seg.text }}</template>
                      </span>
                    </h2>
                    <GorgBadge size="xs" tone="neutral">{{ resultKindMeta[r.kind].label }}</GorgBadge>
                  </div>

                  <p class="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    <span v-for="(seg, i) in segments(r.snippet)" :key="i">
                      <mark v-if="seg.hit" class="rounded-[3px] bg-ember-200 px-0.5 text-ember-950 dark:bg-ember-900 dark:text-ember-50">{{ seg.text }}</mark>
                      <template v-else>{{ seg.text }}</template>
                    </span>
                  </p>

                  <p class="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-[var(--text-muted)]">
                    <span>{{ r.meta }}</span>
                    <span aria-hidden="true">·</span>
                    <span class="tabular-nums">{{ Math.round(r.score * 100) }}% match</span>
                  </p>
                </div>
              </div>
            </article>
          </li>
        </ul>

        <GorgCard v-else>
          <GorgEmptyState
            icon="lucide:search-x"
            title="No results"
            :description="query.trim() ? `Nothing matches “${query}”. Try a broader term.` : 'Start typing to search.'"
          />
        </GorgCard>
      </div>
    </div>
  </div>
</template>
