<script setup lang="ts">
import type { VidJobStage, VidStatus } from '~/utils/mock-media'
import { formatCompact, groupInt, slotColor } from '~/utils/chart'
import { isoDay, relativeLabel, shortDayLabel } from '~/utils/datetime'
import {
  VID_DAYS,
  VID_RETENTION_POINTS,
  vidAssets,
  vidCollectionIndex,
  vidDayLabels,
  vidEncodingQueue,
  vidJobStageMeta,
  vidPulse,
  vidRetention,
  vidRetentionPicks,
  vidStatusMeta,
  vidStorageQuotaGb,
  vidStorageTiers,
  vidViewsDaily,
  vidWatchHoursDaily,
} from '~/utils/mock-media'

useHead({ title: 'Video library' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const trends = useTemplateRef<HTMLElement>('trends')
useStagger(trends, { each: 0.08 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.08 })

const queuePanel = useTemplateRef<HTMLElement>('queuePanel')
useReveal(queuePanel, { y: 14 })

/* -- range ---------------------------------------------------------------- */
const RANGES = [7, 30, 90] as const
const rangeKey = ref('30')
const range = computed(() => Number(rangeKey.value))
const rangeItems = RANGES.map(r => ({ value: String(r), label: `${r}d` }))

function tail<T>(arr: T[], n: number): T[] {
  return arr.slice(-n)
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

const labels = computed(() => tail(vidDayLabels, range.value))

/* Views are a count and watch time is a duration. They are never drawn against
   two y-axes — each gets its own plot, and each keeps its own slot colour. */
const viewSeries = computed(() => [{ name: 'Views', data: tail(vidViewsDaily, range.value) }])
const watchSeries = computed(() => [{
  name: 'Watch hours',
  data: tail(vidWatchHoursDaily, range.value),
  color: slotColor(1),
}])

const viewsInRange = computed(() => sum(tail(vidViewsDaily, range.value)))
const hoursInRange = computed(() => sum(tail(vidWatchHoursDaily, range.value)))

/* -- library -------------------------------------------------------------- */

/** Ascending sort puts the assets that need a human at the top. */
const STATUS_RANK: Record<VidStatus, number> = { failed: 0, processing: 1, unlisted: 2, live: 3 }

const statusFilter = ref('all')
const statusItems = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live', icon: 'lucide:circle-check' },
  { value: 'processing', label: 'Processing', icon: 'lucide:loader-circle' },
  { value: 'unlisted', label: 'Unlisted', icon: 'lucide:eye-off' },
  { value: 'failed', label: 'Failed', icon: 'lucide:circle-x' },
]

const {
  query,
  sortKey,
  sortDirection,
  page,
  pageSize,
  visible: assets,
  total,
  isFiltered,
  reset,
} = useCollection(vidAssets, {
  searchFields: ['title', 'collection'],
  filters: {
    status: a => statusFilter.value === 'all' || a.status === statusFilter.value,
  },
  initialSort: 'day',
  initialDirection: 'desc',
  pageSize: 8,
  comparators: {
    // Alphabetical status is meaningless; rank by what needs attention first.
    status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  },
})

// Narrowing the status must not strand the reader on a page that no longer exists.
watch(statusFilter, () => { page.value = 1 })

function clearAll() {
  reset()
  statusFilter.value = 'all'
}

const columns = [
  { key: 'title', label: 'Video', width: '22rem', sortable: true },
  { key: 'durationSec', label: 'Duration', align: 'end' as const, width: '7rem', nowrap: true, sortable: true },
  { key: 'day', label: 'Published', width: '9rem', nowrap: true, sortable: true },
  { key: 'views', label: 'Views', align: 'end' as const, width: '7rem', sortable: true },
  { key: 'completion', label: 'Completion', align: 'end' as const, width: '9rem', sortable: true },
  { key: 'status', label: 'Status', width: '11rem', sortable: true },
]

/* -- retention ------------------------------------------------------------
   A curve is only kept for the videos offered here, which is exactly why the
   selector is a fixed set rather than every row in the table. */
const selected = ref(vidRetentionPicks[0]!)
/** Short labels — a segmented control is not the place for a full video title. */
const PICK_LABELS: Record<string, string> = {
  'v-201': 'Slab flattening',
  'v-202': 'Cabinet joints',
  'v-204': 'Build night',
  'v-205': 'Dovetails',
}
const picks = vidRetentionPicks.map(id => ({ value: id, label: PICK_LABELS[id] ?? id }))

const selectedAsset = computed(() => vidAssets.find(a => a.id === selected.value)!)
const curve = computed(() => vidRetention[selected.value] ?? [])

const clock = (s: number) => {
  const total = Math.round(s)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

/** Axis ticks are positions in the runtime, not abstract percentages. */
const retentionLabels = computed(() => Array.from(
  { length: VID_RETENTION_POINTS },
  (_, i) => clock((i / (VID_RETENTION_POINTS - 1)) * selectedAsset.value.durationSec),
))

const retentionSeries = computed(() => [{
  name: 'Viewers still watching',
  data: curve.value,
  color: slotColor(vidCollectionIndex(selectedAsset.value.collection)),
}])

/** The one moment worth acting on: the steepest single step down. */
const steepest = computed(() => {
  const c = curve.value
  let worst = { drop: 0, index: 1 }
  for (let i = 1; i < c.length; i++) {
    const drop = (c[i - 1] ?? 0) - (c[i] ?? 0)
    if (drop > worst.drop)
      worst = { drop, index: i }
  }
  const at = (worst.index / (VID_RETENTION_POINTS - 1)) * selectedAsset.value.durationSec
  return { drop: worst.drop, at: clock(at) }
})

/** Where half the audience has gone, linearly interpolated between samples. */
const halfGone = computed(() => {
  const c = curve.value
  const i = c.findIndex(v => v < 50)
  if (i <= 0)
    return null
  const prev = c[i - 1]!
  const cur = c[i]!
  const t = prev === cur ? 0 : (prev - 50) / (prev - cur)
  const step = selectedAsset.value.durationSec / (VID_RETENTION_POINTS - 1)
  return clock((i - 1 + t) * step)
})

function pickFromRow(row: Record<string, any>) {
  if (vidRetention[row.id as string])
    selected.value = row.id as string
}

/* -- storage -------------------------------------------------------------- */

const storageUsedGb = vidStorageTiers.reduce((a, t) => a + t.gb, 0)
const tb = (gb: number) => `${(gb / 1000).toFixed(1)} TB`
const sharePct = (gb: number) => (gb / vidStorageQuotaGb) * 100

/* -- formatters ----------------------------------------------------------- */

const pct = (n: number) => `${n.toFixed(1)}%`
const secs = (s: number) => clock(s)
const hours = (n: number) => `${formatCompact(n)} hrs`
const statusOf = (s: string) => vidStatusMeta[s as VidStatus]
const stageOf = (s: string) => vidJobStageMeta[s as VidJobStage]
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Video library</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ groupInt(vidPulse.assets) }} assets · {{ tb(storageUsedGb) }} stored ·
          {{ vidPulse.encodingJobs }} jobs in the encoder.
        </p>
      </div>

      <GorgSegmented
        v-model="rangeKey"
        :items="rangeItems"
        variant="pill"
        aria-label="Date range"
        class="shrink-0"
      />
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Watch time"
        :value="vidPulse.watchHours"
        :delta="vidPulse.watchDelta"
        icon="lucide:hourglass"
        :format="hours"
        :sparkline="tail(vidWatchHoursDaily, range)"
      />
      <GorgStatTile
        label="Views"
        :value="vidPulse.views"
        :delta="vidPulse.viewsDelta"
        icon="lucide:play"
        :format="n => formatCompact(n)"
        :sparkline="tail(vidViewsDaily, range)"
      />
      <GorgStatTile
        label="Avg. view duration"
        :value="vidPulse.avgViewSeconds"
        :delta="vidPulse.avgViewDelta"
        icon="lucide:timer"
        :format="secs"
      />
      <GorgStatTile
        label="Completion rate"
        :value="vidPulse.completion"
        :delta="vidPulse.completionDelta"
        :decimals="1"
        icon="lucide:flag"
        :format="pct"
      />
    </div>

    <!-- two plots, never two y-axes: a count and a duration do not share a scale -->
    <div ref="trends" class="grid gap-4 lg:grid-cols-2">
      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="Views over time"
          :subtitle="`${groupInt(viewsInRange)} views in the last ${range} days`"
          :series="viewSeries"
          :labels="labels"
          :height="280"
        >
          <GorgLineChart
            :series="viewSeries"
            :labels="labels"
            area
            :height="280"
            :show-markers="range <= 30"
            :format="n => formatCompact(n)"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="Watch time"
          :subtitle="`${formatCompact(hoursInRange)} hours, plotted separately`"
          :series="watchSeries"
          :labels="labels"
          :height="280"
        >
          <GorgLineChart
            :series="watchSeries"
            :labels="labels"
            area
            :height="280"
            :show-markers="range <= 30"
            :format="n => formatCompact(n)"
          />
        </GorgChartFrame>
      </GorgCard>
    </div>

    <!-- library -->
    <GorgCard :padded="false" class="min-w-0">
      <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">Library</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ total }} of {{ vidAssets.length }} assets · select a row to load its retention curve
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <GorgInput
            v-model="query"
            size="sm"
            icon="lucide:search"
            placeholder="Title or collection"
            clearable
            aria-label="Search the library"
            class="w-full sm:w-56"
          />
          <!-- scrolls rather than pushing the page wide on a narrow screen -->
          <div class="w-full overflow-x-auto sm:w-auto">
            <GorgSegmented
              v-model="statusFilter"
              :items="statusItems"
              size="xs"
              aria-label="Filter by status"
            />
          </div>
        </div>
      </div>

      <GorgTable
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :columns="columns"
        :rows="assets"
        row-key="id"
        hoverable
        @row-click="pickFromRow"
      >
        <template #cell-title="{ row }">
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-field text-sm font-semibold"
              :style="{
                background: `color-mix(in oklch, ${slotColor(vidCollectionIndex(row.collection))} 18%, transparent)`,
                color: slotColor(vidCollectionIndex(row.collection)),
              }"
              aria-hidden="true"
            >{{ row.glyph }}</span>

            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ row.title }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">
                {{ row.collection }}<span v-if="row.note"> · {{ row.note }}</span>
              </p>

              <!-- the status column is scrolled off the card on a phone -->
              <p class="mt-1.5 md:hidden">
                <GorgBadge :tone="statusOf(row.status).tone" size="xs">
                  <Icon
                    :name="statusOf(row.status).icon"
                    class="size-3"
                    :class="row.status === 'processing' && 'animate-spin'"
                    aria-hidden="true"
                  />
                  {{ statusOf(row.status).label }}
                </GorgBadge>
              </p>
            </div>
          </div>
        </template>

        <template #cell-durationSec="{ value }">
          <span class="tabular-nums text-[var(--text-muted)]">{{ clock(value as number) }}</span>
        </template>

        <template #cell-day="{ row }">
          <div class="min-w-0">
            <time :datetime="isoDay(row.day)" class="block text-sm text-[var(--text-strong)]">
              {{ shortDayLabel(row.day) }}
            </time>
            <span class="text-xs text-[var(--text-muted)]">{{ relativeLabel(row.day) }}</span>
          </div>
        </template>

        <template #cell-views="{ value }">
          <span class="tabular-nums">{{ formatCompact(value as number) }}</span>
        </template>

        <template #cell-completion="{ row }">
          <div class="flex items-center justify-end gap-2">
            <div class="h-1.5 w-12 shrink-0 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill bg-tide-500"
                :style="{ width: `${Math.max(2, row.completion * 100)}%` }"
              />
            </div>
            <span class="w-10 shrink-0 text-end text-sm tabular-nums text-[var(--text-strong)]">
              {{ (row.completion * 100).toFixed(0) }}%
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <GorgBadge :tone="statusOf(row.status).tone" size="xs">
            <Icon
              :name="statusOf(row.status).icon"
              class="size-3"
              :class="row.status === 'processing' && 'animate-spin'"
              aria-hidden="true"
            />
            {{ statusOf(row.status).label }}
          </GorgBadge>
        </template>

        <template #empty>
          <GorgEmptyState
            icon="lucide:file-video"
            title="Nothing on this filter"
            :description="isFiltered ? 'No asset matches that search.' : 'No asset is in this state right now.'"
          >
            <template #action>
              <GorgButton size="sm" variant="outline" @click="clearAll">
                Show the whole library
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
          :page-sizes="[8, 16]"
          unit="videos"
          label="Library pages"
        />
      </div>
    </GorgCard>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <!-- retention -->
      <GorgCard class="min-w-0 lg:col-span-2">
        <template #header>
          <div class="w-full overflow-x-auto">
            <GorgSegmented
              v-model="selected"
              :items="picks"
              size="xs"
              aria-label="Video for the retention curve"
            />
          </div>
        </template>

        <GorgChartFrame
          title="Where viewers drop off"
          :subtitle="`${selectedAsset.title} · ${clock(selectedAsset.durationSec)} runtime`"
          :series="retentionSeries"
          :labels="retentionLabels"
          :height="260"
        >
          <GorgLineChart
            :series="retentionSeries"
            :labels="retentionLabels"
            area
            :height="260"
            :show-markers="false"
            :format="n => `${Math.round(n)}%`"
          />
        </GorgChartFrame>

        <dl class="mt-4 grid gap-3 border-t border-[var(--surface-border)] pt-4 sm:grid-cols-3">
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Steepest drop</dt>
            <dd class="mt-0.5 text-sm font-semibold text-[var(--text-strong)]">
              −{{ steepest.drop }} pts
              <span class="font-normal tabular-nums text-[var(--text-muted)]">at {{ steepest.at }}</span>
            </dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Half the audience gone</dt>
            <dd class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
              {{ halfGone ?? 'not before the end' }}
            </dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Watched to the end</dt>
            <dd class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
              {{ curve.at(-1) ?? 0 }}%
            </dd>
          </div>
        </dl>
      </GorgCard>

      <!-- storage -->
      <GorgCard class="min-w-0 self-start">
        <template #title>
          Storage
        </template>
        <template #subtitle>
          {{ tb(storageUsedGb) }} of {{ tb(vidStorageQuotaGb) }} on the media plan
        </template>

        <div class="flex h-3 w-full overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
          <div
            v-for="(tier, i) in vidStorageTiers"
            :key="tier.label"
            class="h-full first:rounded-s-pill"
            :style="{ width: `${sharePct(tier.gb)}%`, background: slotColor(i) }"
            :title="tier.label"
          />
        </div>

        <p class="mt-2 text-xs text-[var(--text-muted)]">
          {{ ((storageUsedGb / vidStorageQuotaGb) * 100).toFixed(0) }}% used ·
          {{ tb(vidStorageQuotaGb - storageUsedGb) }} free
        </p>

        <ul class="mt-4 space-y-2.5 border-t border-[var(--surface-border)] pt-4">
          <li v-for="(tier, i) in vidStorageTiers" :key="tier.label" class="flex items-center gap-2 text-sm">
            <span class="size-2.5 shrink-0 rounded-[3px]" :style="{ background: slotColor(i) }" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate text-[var(--text-strong)]">{{ tier.label }}</span>
            <span class="shrink-0 tabular-nums text-[var(--text-muted)]">{{ tb(tier.gb) }}</span>
          </li>
        </ul>
      </GorgCard>
    </div>

    <!-- encoding queue -->
    <div ref="queuePanel" class="js-reveal min-w-0">
      <GorgCard :padded="false" class="min-w-0">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
              <span class="relative flex size-2 shrink-0" aria-hidden="true">
                <span class="absolute inline-flex size-full animate-ping rounded-pill bg-tide-500 opacity-60" />
                <span class="relative inline-flex size-2 rounded-pill bg-tide-600" />
              </span>
              Encoding queue
            </h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ vidEncodingQueue.filter(j => j.stage !== 'failed').length }} running ·
              {{ vidEncodingQueue.filter(j => j.stage === 'failed').length }} needs a decision
            </p>
          </div>
          <GorgButton variant="outline" size="xs">
            <template #lead>
              <Icon name="lucide:settings-2" class="size-3.5" />
            </template>
            Presets
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="job in vidEncodingQueue"
            :key="job.id"
            class="flex flex-col gap-3 px-4 py-3.5 transition-colors duration-(--duration-snap)
                   hover:bg-[var(--surface-sunken)] sm:flex-row sm:items-center"
          >
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-[var(--text-strong)]">{{ job.title }}</span>
                <GorgBadge :tone="stageOf(job.stage).tone" size="xs">
                  <Icon :name="stageOf(job.stage).icon" class="size-3" aria-hidden="true" />
                  {{ stageOf(job.stage).label }}
                </GorgBadge>
              </p>
              <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
                <span class="font-mono">{{ job.worker }}</span>
                <span>{{ job.preset }}</span>
                <span v-if="job.etaMin > 0" class="tabular-nums">{{ job.etaMin }} min left</span>
                <span v-else class="font-medium text-[var(--color-critical)]">stopped</span>
              </p>
            </div>

            <div class="w-full shrink-0 sm:w-48">
              <GorgProgress
                :value="job.progress * 100"
                size="xs"
                :tone="job.stage === 'failed' ? 'critical' : 'brand'"
                show-value
                :label="stageOf(job.stage).label"
              />
            </div>

            <GorgButton
              v-if="job.stage === 'failed'"
              variant="outline"
              size="xs"
              class="shrink-0"
            >
              <template #lead>
                <Icon name="lucide:rotate-ccw" class="size-3.5" />
              </template>
              Retry
            </GorgButton>
          </li>
        </ul>
      </GorgCard>
    </div>
  </div>
</template>
