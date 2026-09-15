<script setup lang="ts">
import type { EdArticle, EdStatus } from '~/utils/mock-comms'
import { formatCompact, groupInt } from '~/utils/chart'
import { demoDate, isoDay, monthDayLabel, relativeLabel, shortDayLabel, timeLabel, weekdayLabel } from '~/utils/datetime'
import {
  EDITORIAL_WEEKS,
  edArticles,
  edPulse,
  edSchedule,
  edSectionReadTime,
  edWeekReads,
  edWeekViews,
} from '~/utils/mock-comms'

useHead({ title: 'Editorial' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.06 })

const stripCard = useTemplateRef<HTMLElement>('stripCard')
useReveal(stripCard, { y: 16 })

/* -- publishing strip ------------------------------------------------------
   A fortnight of slots derived from the fixed demo epoch, so the strip reads
   the same on the server and in the browser. */
const STRIP_DAYS = 14
const TODAY = isoDay(0)

const strip = computed(() => Array.from({ length: STRIP_DAYS }, (_, day) => {
  const date = demoDate(day)
  return {
    day,
    iso: isoDay(date),
    weekday: weekdayLabel(date),
    label: shortDayLabel(date),
    isToday: isoDay(date) === TODAY,
    items: edSchedule.filter(s => s.day === day),
  }
}))

const scheduledCount = computed(() => edSchedule.length)

/** "next up “Weekly digest #37” at 16:00" — built in script so the template
 *  never has to narrow an optional through an interpolation. */
const nextSlotLabel = computed(() => {
  const slot = edSchedule[0]
  if (!slot)
    return ''
  return `next up “${slot.title}” at ${timeLabel(demoDate(slot.day, slot.timeHour, slot.timeMinute))}`
})

/* -- audience --------------------------------------------------------------
   Views and completed reads share a unit, so they belong on one plot. Read
   time is measured in minutes and gets a plot of its own. */
const weekLabels = Array.from({ length: EDITORIAL_WEEKS }, (_, i) =>
  monthDayLabel(demoDate(-7 * (EDITORIAL_WEEKS - 1 - i))))

const audienceSeries = [
  { name: 'Views', data: edWeekViews },
  { name: 'Completed reads', data: edWeekReads },
]

const readTimeSeries = [
  { name: 'Average read time', data: edSectionReadTime.map(s => s.minutes) },
]
const readTimeLabels = edSectionReadTime.map(s => s.name)

const viewsTotal = edWeekViews.reduce((a, v) => a + v, 0)
const readsTotal = edWeekReads.reduce((a, v) => a + v, 0)

/* -- top performers -------------------------------------------------------- */
const published = computed(() => edArticles.filter(a => a.status === 'published'))

const topPieces = computed(() =>
  [...published.value]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map(a => ({
      label: a.title,
      value: a.views,
      icon: sectionIcon[a.section] ?? 'lucide:file-text',
    })))

/* -- desk workload --------------------------------------------------------- */
const workload = computed(() => {
  const map = new Map<string, { name: string, role: string, open: number, words: number }>()
  for (const a of edArticles) {
    if (a.status === 'published')
      continue
    const entry = map.get(a.author) ?? { name: a.author, role: a.authorRole, open: 0, words: 0 }
    entry.open += 1
    entry.words += a.words
    map.set(a.author, entry)
  }
  return [...map.values()].sort((a, b) => b.open - a.open)
})

/* -- article table --------------------------------------------------------- */
type StatusFilter = 'all' | EdStatus

const statusFilter = ref<StatusFilter>('all')
const statusFilterModel = computed<string>({
  get: () => statusFilter.value,
  set: (v) => { statusFilter.value = v as StatusFilter },
})

const statusCounts = computed(() => ({
  'all': edArticles.length,
  'draft': edArticles.filter(a => a.status === 'draft').length,
  'in review': edArticles.filter(a => a.status === 'in review').length,
  'scheduled': edArticles.filter(a => a.status === 'scheduled').length,
  'published': edArticles.filter(a => a.status === 'published').length,
}))

const statusFilterItems = computed(() => [
  { value: 'all', label: `All ${statusCounts.value.all}` },
  { value: 'draft', label: `Draft ${statusCounts.value.draft}` },
  { value: 'in review', label: `In review ${statusCounts.value['in review']}` },
  { value: 'scheduled', label: `Scheduled ${statusCounts.value.scheduled}` },
  { value: 'published', label: `Published ${statusCounts.value.published}` },
])

const columns = [
  { key: 'title', label: 'Article', sortable: true, width: '22rem' },
  { key: 'author', label: 'Author', sortable: true },
  { key: 'status', label: 'Status', sortable: true, align: 'center' as const },
  { key: 'words', label: 'Words', sortable: true, align: 'end' as const, nowrap: true },
  { key: 'readMins', label: 'Read', sortable: true, align: 'end' as const, nowrap: true },
  { key: 'views', label: 'Performance', sortable: true, align: 'end' as const, width: '11rem' },
]

const STATUS_ORDER: EdStatus[] = ['draft', 'in review', 'scheduled', 'published']

const {
  query,
  sortKey,
  sortDirection,
  page,
  pageSize,
  visible,
  total,
  isFiltered,
} = useCollection(edArticles, {
  searchFields: ['title', 'section', 'author'],
  filters: {
    status: a => statusFilter.value === 'all' || a.status === statusFilter.value,
  },
  initialSort: 'views',
  initialDirection: 'desc',
  pageSize: 8,
  comparators: {
    // Status is a workflow order, not an alphabet.
    status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  },
})

/* -- presentation maps ----------------------------------------------------- */
const statusMeta: Record<EdStatus, { tone: 'neutral' | 'caution' | 'info' | 'positive', icon: string }> = {
  'draft': { tone: 'neutral', icon: 'lucide:pencil-line' },
  'in review': { tone: 'caution', icon: 'lucide:eye' },
  'scheduled': { tone: 'info', icon: 'lucide:calendar-clock' },
  'published': { tone: 'positive', icon: 'lucide:check-check' },
}

const sectionIcon: Record<string, string> = {
  'Engineering': 'lucide:code-xml',
  'Product': 'lucide:package',
  'Design': 'lucide:palette',
  'Support': 'lucide:life-buoy',
  'Finance': 'lucide:banknote',
  'People': 'lucide:users',
  'Data': 'lucide:database',
  'Newsletter': 'lucide:mail',
}

const channelIcon: Record<string, string> = {
  Blog: 'lucide:notebook-pen',
  Newsletter: 'lucide:mail',
  Docs: 'lucide:book-open',
  Social: 'lucide:megaphone',
}

/** Published work shows its date, everything else shows when it last moved. */
function whenLabel(a: EdArticle): string {
  const days = Math.round((a.at.getTime() - demoDate(0).getTime()) / 86_400_000)
  if (a.status === 'scheduled')
    return `goes out ${relativeLabel(days)}`
  if (a.status === 'published')
    return `published ${relativeLabel(days)}`
  return `edited ${relativeLabel(days)}`
}

function completionRate(a: EdArticle): number {
  return a.views ? a.completions / a.views : 0
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Editorial desk</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          What is being written, what goes out next, and how the last month read.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:calendar-days" class="size-4" />
          </template>
          Calendar
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:pen-line" class="size-4" />
          </template>
          New draft
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Drafts in progress"
        :value="edPulse.draftsInProgress"
        :delta="edPulse.draftsDelta"
        icon="lucide:pencil-line"
        :sparkline="edPulse.draftsTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Published this month"
        :value="edPulse.publishedThisMonth"
        :delta="edPulse.publishedDelta"
        icon="lucide:send"
        :sparkline="edPulse.publishedTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Average read time"
        :value="edPulse.avgReadMins"
        :delta="edPulse.readDelta"
        icon="lucide:hourglass"
        :decimals="1"
        :sparkline="edPulse.readTrend"
        :format="n => `${n.toFixed(1)} min`"
      />
      <GorgStatTile
        label="Engagement"
        :value="edPulse.engagement * 100"
        :delta="edPulse.engagementDelta"
        icon="lucide:heart-handshake"
        :decimals="1"
        :sparkline="edPulse.engagementTrend"
        :format="n => `${n.toFixed(1)}%`"
      />
    </div>

    <!-- publishing strip -->
    <div ref="stripCard" class="js-reveal min-w-0">
      <GorgCard :padded="false" class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Publishing schedule</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ scheduledCount }} slots over the next fortnight<span v-if="nextSlotLabel"> · {{ nextSlotLabel }}</span>
            </p>
          </div>
          <GorgBadge tone="info" size="xs">
            <Icon name="lucide:calendar-clock" class="size-3" aria-hidden="true" />
            {{ statusCounts.scheduled }} scheduled pieces
          </GorgBadge>
        </div>

        <div class="overflow-x-auto p-4">
          <ol class="flex min-w-0 gap-3">
            <li
              v-for="cell in strip"
              :key="cell.iso"
              class="w-40 shrink-0 rounded-card border p-3"
              :class="cell.isToday
                ? 'border-tide-500 bg-tide-50 dark:bg-tide-900/25'
                : 'border-[var(--surface-border)] bg-[var(--surface-raised)]'"
            >
              <p class="flex items-baseline justify-between gap-2">
                <span class="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  {{ cell.weekday }}
                </span>
                <time :datetime="cell.iso" class="text-xs tabular-nums text-[var(--text-muted)]">
                  {{ cell.label }}
                </time>
              </p>

              <p v-if="cell.isToday" class="mt-1">
                <GorgBadge tone="brand" size="xs">
                  <Icon name="lucide:dot" class="size-3" aria-hidden="true" />
                  Today
                </GorgBadge>
              </p>

              <ul v-if="cell.items.length" class="mt-2 space-y-2">
                <li
                  v-for="slot in cell.items"
                  :key="slot.id"
                  class="rounded-field bg-[var(--surface-sunken)] p-2"
                >
                  <p class="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Icon :name="channelIcon[slot.channel] ?? 'lucide:notebook-pen'" class="size-3 shrink-0" aria-hidden="true" />
                    <span class="truncate">{{ slot.channel }}</span>
                    <span class="ms-auto shrink-0 tabular-nums">
                      {{ timeLabel(demoDate(slot.day, slot.timeHour, slot.timeMinute)) }}
                    </span>
                  </p>
                  <p class="mt-1 line-clamp-2 text-xs font-medium text-[var(--text-strong)]">
                    {{ slot.title }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{{ slot.author }}</p>
                </li>
              </ul>

              <p v-else class="mt-3 text-xs text-[var(--text-muted)]">No slot booked</p>
            </li>
          </ol>
        </div>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <GorgCard class="min-w-0 lg:col-span-2">
        <GorgChartFrame
          title="Audience over twelve weeks"
          :subtitle="`${formatCompact(viewsTotal)} views · ${formatCompact(readsTotal)} finished the piece`"
          :series="audienceSeries"
          :labels="weekLabels"
          :height="270"
        >
          <GorgLineChart
            :series="audienceSeries"
            :labels="weekLabels"
            :height="270"
            area
            :format="n => formatCompact(n)"
          />
        </GorgChartFrame>
      </GorgCard>

      <div class="min-w-0">
        <GorgWidgetRankedList
          title="Top performing pieces"
          :rows="topPieces"
          :format="n => groupInt(n)"
        />
      </div>
    </div>

    <!-- articles -->
    <div class="min-w-0">
      <GorgCard :padded="false" class="min-w-0">
        <div class="space-y-3 border-b border-[var(--surface-border)] p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-strong)]">Articles</h2>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">
                {{ total }} of {{ edArticles.length }} pieces on the desk.
              </p>
            </div>
            <GorgInput
              v-model="query"
              placeholder="Search titles, authors…"
              icon="lucide:search"
              size="sm"
              clearable
              class="w-full sm:max-w-56"
            />
          </div>

          <div class="overflow-x-auto pb-0.5">
            <GorgSegmented
              v-model="statusFilterModel"
              :items="statusFilterItems"
              size="xs"
              aria-label="Filter by article status"
            />
          </div>
        </div>

        <GorgTable
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          :columns="columns"
          :rows="visible"
          row-key="id"
          striped
        >
          <template #cell-title="{ row }">
            <div class="flex min-w-0 items-start gap-2.5">
              <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                <Icon
                  :name="sectionIcon[(row as EdArticle).section] ?? 'lucide:file-text'"
                  class="size-4"
                  aria-hidden="true"
                />
              </span>
              <div class="min-w-0">
                <p class="font-medium text-balance text-[var(--text-strong)]">{{ (row as EdArticle).title }}</p>
                <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {{ (row as EdArticle).section }} · {{ whenLabel(row as EdArticle) }}
                </p>
              </div>
            </div>
          </template>

          <template #cell-author="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <GorgAvatar :name="(row as EdArticle).author" size="sm" />
              <div class="min-w-0">
                <p class="truncate text-sm text-[var(--text-strong)]">{{ (row as EdArticle).author }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ (row as EdArticle).authorRole }}</p>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <GorgBadge :tone="statusMeta[(row as EdArticle).status].tone" size="xs">
              <Icon :name="statusMeta[(row as EdArticle).status].icon" class="size-3" aria-hidden="true" />
              {{ (row as EdArticle).status }}
            </GorgBadge>
          </template>

          <template #cell-words="{ row }">
            <span class="text-sm tabular-nums text-[var(--text-strong)]">
              {{ groupInt((row as EdArticle).words) }}
            </span>
          </template>

          <template #cell-readMins="{ row }">
            <span class="text-sm tabular-nums text-[var(--text-muted)]">
              {{ (row as EdArticle).readMins.toFixed(1) }} min
            </span>
          </template>

          <template #cell-views="{ row }">
            <div v-if="(row as EdArticle).views" class="min-w-0">
              <p class="flex items-baseline justify-end gap-1.5">
                <span class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                  {{ groupInt((row as EdArticle).views) }}
                </span>
                <span class="text-[11px] text-[var(--text-muted)]">views</span>
              </p>
              <p class="text-[11px] tabular-nums text-[var(--text-muted)]">
                {{ (completionRate(row as EdArticle) * 100).toFixed(0) }}% finished
              </p>
              <GorgSparkline :data="(row as EdArticle).trend" :height="26" class="mt-1" />
            </div>
            <span v-else class="text-sm text-[var(--text-muted)]">not live yet</span>
          </template>

          <template #empty>
            <GorgEmptyState
              icon="lucide:file-search"
              title="Nothing on the desk"
              :description="isFiltered
                ? 'No article matches that search in this status.'
                : 'No article carries this status right now.'"
            >
              <template #action>
                <GorgButton variant="outline" size="sm" @click="statusFilter = 'all'">
                  Show everything
                </GorgButton>
              </template>
            </GorgEmptyState>
          </template>
        </GorgTable>

        <div class="border-t border-[var(--surface-border)] p-4">
          <GorgPagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :total="total"
            unit="articles"
            :page-sizes="[8, 16, 32]"
          />
        </div>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <GorgCard class="min-w-0 lg:col-span-2">
        <GorgChartFrame
          title="Average read time by section"
          subtitle="Minutes a reader spends before leaving"
          :series="readTimeSeries"
          :labels="readTimeLabels"
          :height="250"
        >
          <GorgBarChart
            :series="readTimeSeries"
            :labels="readTimeLabels"
            :height="250"
            :format="n => `${n}m`"
          />
        </GorgChartFrame>
      </GorgCard>

      <div class="min-w-0">
        <GorgCard>
          <template #title>
            Desk workload
          </template>
          <template #subtitle>
            Unpublished work per writer
          </template>

          <ul class="space-y-3">
            <li v-for="w in workload" :key="w.name" class="flex items-center gap-3">
              <GorgAvatar :name="w.name" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ w.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ w.role }}</p>
              </div>
              <div class="shrink-0 text-end">
                <p class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">{{ w.open }}</p>
                <p class="text-[11px] tabular-nums text-[var(--text-muted)]">
                  {{ formatCompact(w.words) }} words
                </p>
              </div>
            </li>
          </ul>
        </GorgCard>
      </div>
    </div>
  </div>
</template>
