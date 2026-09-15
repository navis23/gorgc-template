<script setup lang="ts">
import type { MediaKind } from '~/utils/mock-collections'
import { formatCompact } from '~/utils/chart'
import { dayLabel, relativeLabel } from '~/utils/datetime'
import { mediaLibrary } from '~/utils/mock-collections'

useHead({ title: 'Media list' })

type ViewMode = 'list' | 'compact'
type SortKey = 'newest' | 'views' | 'discussed'

const query = ref('')
const tag = ref<string | null>(null)
const mode = ref<ViewMode>('list')
const sortKey = ref<SortKey>('newest')

const sortItems = [
  { label: 'Newest first', value: 'newest', icon: 'lucide:calendar' },
  { label: 'Most viewed', value: 'views', icon: 'lucide:eye' },
  { label: 'Most discussed', value: 'discussed', icon: 'lucide:message-circle' },
]

const modes: Array<{ value: ViewMode, label: string, icon: string }> = [
  { value: 'list', label: 'List', icon: 'lucide:rows-3' },
  { value: 'compact', label: 'Compact', icon: 'lucide:menu' },
]

const kinds: Record<MediaKind, { label: string, icon: string, wash: string, tone: 'brand' | 'info' | 'accent' | 'neutral' }> = {
  article: { label: 'Article', icon: 'lucide:file-text', wash: 'from-tide-400 to-tide-700', tone: 'brand' },
  guide: { label: 'Guide', icon: 'lucide:book-open', wash: 'from-[var(--color-info)] to-tide-800', tone: 'info' },
  recording: { label: 'Recording', icon: 'lucide:circle-play', wash: 'from-ember-400 to-ember-700', tone: 'accent' },
  dataset: { label: 'Dataset', icon: 'lucide:database', wash: 'from-ink-500 to-ink-800', tone: 'neutral' },
}

const items = computed(() => {
  const q = query.value.trim().toLowerCase()
  const filtered = mediaLibrary.filter((item) => {
    if (tag.value && !item.tags.includes(tag.value))
      return false
    if (!q)
      return true
    return item.title.toLowerCase().includes(q)
      || item.excerpt.toLowerCase().includes(q)
      || item.author.toLowerCase().includes(q)
  })

  return filtered.sort((a, b) => {
    if (sortKey.value === 'views')
      return b.views - a.views
    if (sortKey.value === 'discussed')
      return b.comments - a.comments
    return b.publishedDaysAgo - a.publishedDaysAgo
  })
})

function toggleTag(value: string) {
  tag.value = tag.value === value ? null : value
}

function reset() {
  query.value = ''
  tag.value = null
}

const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.05, y: 16 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Library</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ items.length }} of {{ mediaLibrary.length }} entries · articles, guides, recordings and datasets
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:upload" class="size-4" />
        </template>
        Publish entry
      </GorgButton>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <GorgInput
        v-model="query"
        placeholder="Search the library…"
        icon="lucide:search"
        size="sm"
        clearable
        class="w-full sm:max-w-xs"
      />

      <GorgSelect
        :items="sortItems"
        :model-value="sortKey"
        size="sm"
        aria-label="Sort entries"
        class="w-full sm:ms-auto sm:w-48"
        @update:model-value="value => sortKey = value as SortKey"
      />

      <div class="flex items-center gap-1 rounded-pill bg-[var(--surface-sunken)] p-1" role="group" aria-label="Row size">
        <button
          v-for="m in modes"
          :key="m.value"
          type="button"
          :aria-pressed="mode === m.value"
          class="inline-flex h-7 items-center gap-1.5 rounded-pill px-2.5 text-xs font-medium transition-colors duration-(--duration-snap)"
          :class="mode === m.value
            ? 'bg-[var(--surface-raised)] text-[var(--text-strong)] shadow-raise'
            : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'"
          @click="mode = m.value"
        >
          <Icon :name="m.icon" class="size-3.5" aria-hidden="true" />
          {{ m.label }}
        </button>
      </div>
    </div>

    <p v-if="tag" class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
      Filtered by tag
      <button
        type="button"
        class="inline-flex h-6 items-center gap-1.5 rounded-pill bg-tide-600 px-2 text-xs font-medium text-white
               transition-colors duration-(--duration-snap) hover:bg-tide-700"
        @click="tag = null"
      >
        {{ tag }}
        <Icon name="lucide:x" class="size-3" aria-hidden="true" />
        <span class="sr-only">Remove tag filter</span>
      </button>
    </p>

    <ul v-if="items.length" ref="list" :class="mode === 'compact' ? 'space-y-2' : 'space-y-3'">
      <li v-for="item in items" :key="item.id">
        <article
          class="surface-card shadow-raise transition-[box-shadow,transform] duration-(--duration-base) hover:shadow-float"
          :class="mode === 'compact'
            ? 'flex items-center gap-3 p-3'
            : 'flex flex-col gap-4 p-4 sm:flex-row'"
        >
          <!-- thumbnail: a token wash plus the kind glyph, never an external image -->
          <div
            class="relative grid shrink-0 place-items-center overflow-hidden rounded-field bg-linear-to-br"
            :class="[kinds[item.kind].wash, mode === 'compact' ? 'size-11' : 'h-28 w-full sm:h-24 sm:w-40']"
          >
            <Icon
              :name="kinds[item.kind].icon"
              class="text-white/90"
              :class="mode === 'compact' ? 'size-5' : 'size-8'"
              aria-hidden="true"
            />
            <span
              v-if="mode === 'list'"
              class="absolute bottom-1.5 start-1.5 rounded-pill bg-ink-950/45 px-2 py-0.5 text-[10px] font-medium text-white"
            >
              {{ kinds[item.kind].label }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <GorgBadge v-if="mode === 'compact'" :tone="kinds[item.kind].tone" size="xs">
                {{ kinds[item.kind].label }}
              </GorgBadge>
              <h2 class="min-w-0 text-sm font-semibold text-[var(--text-strong)]" :class="mode === 'compact' && 'truncate'">
                {{ item.title }}
              </h2>
            </div>

            <p v-if="mode === 'list'" class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {{ item.excerpt }}
            </p>

            <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span class="text-xs text-[var(--text-muted)]">
                {{ item.author }} · <time :datetime="String(item.publishedDaysAgo)">{{ dayLabel(item.publishedDaysAgo) }}</time>
              </span>
              <template v-if="mode === 'list'">
                <button
                  v-for="t in item.tags"
                  :key="t"
                  type="button"
                  :aria-pressed="tag === t"
                  class="inline-flex h-5 items-center rounded-pill border px-2 text-[11px] font-medium
                         transition-colors duration-(--duration-snap)"
                  :class="tag === t
                    ? 'border-tide-600 bg-tide-600 text-white'
                    : 'border-[var(--surface-border)] text-[var(--text-muted)] hover:border-tide-400 hover:text-[var(--text-strong)]'"
                  @click="toggleTag(t)"
                >
                  #{{ t }}
                </button>
              </template>
            </div>
          </div>

          <!-- stat cluster: stacks under the copy on a phone, column on the right otherwise -->
          <dl
            class="flex shrink-0 items-center gap-4 text-xs text-[var(--text-muted)]"
            :class="mode === 'compact'
              ? 'hidden sm:flex'
              : 'border-t border-[var(--surface-border)] pt-3 sm:w-28 sm:flex-col sm:items-end sm:gap-2 sm:border-t-0 sm:border-s sm:ps-4 sm:pt-0'"
          >
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:eye" class="size-3.5" aria-hidden="true" />
              <dt class="sr-only">Views</dt>
              <dd class="font-medium tabular-nums text-[var(--text-strong)]">{{ formatCompact(item.views) }}</dd>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:message-circle" class="size-3.5" aria-hidden="true" />
              <dt class="sr-only">Comments</dt>
              <dd class="font-medium tabular-nums text-[var(--text-strong)]">{{ item.comments }}</dd>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:clock" class="size-3.5" aria-hidden="true" />
              <dt class="sr-only">Length</dt>
              <dd class="tabular-nums">{{ item.readMinutes }} min</dd>
            </div>
            <div v-if="mode === 'list'" class="hidden sm:block">
              <dt class="sr-only">Published</dt>
              <dd>{{ relativeLabel(item.publishedDaysAgo) }}</dd>
            </div>
          </dl>
        </article>
      </li>
    </ul>

    <GorgEmptyState
      v-else
      bordered
      icon="lucide:library"
      title="Nothing in the library matches"
      description="Try another search term, or drop the tag filter."
    >
      <template #action>
        <GorgButton size="sm" variant="outline" @click="reset">Clear filters</GorgButton>
      </template>
    </GorgEmptyState>
  </div>
</template>
