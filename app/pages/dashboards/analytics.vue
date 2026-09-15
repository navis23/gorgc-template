<script setup lang="ts">
import { formatCompact, groupInt, slotColor } from '~/utils/chart'
import {
  ANALYTICS_DAYS,
  analyticsAcquisition,
  analyticsBounce,
  analyticsDevicePages,
  analyticsDevices,
  analyticsDuration,
  analyticsLabels,
  analyticsSessions,
  analyticsTopPages,
  analyticsUsers,
} from '~/utils/mock'

useHead({ title: 'Analytics' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.07 })

/* -- range selector -------------------------------------------------------
   The window genuinely reslices the collected series; the preceding window
   of the same length is what every delta is measured against. */
const RANGES = [7, 30, 90] as const
type Range = (typeof RANGES)[number]

/** The segmented control models a string; the window itself stays a number. */
const rangeKey = ref('30')
const range = computed(() => Number(rangeKey.value) as Range)
const rangeItems = RANGES.map(r => ({ value: String(r), label: `${r}d` }))

function tail<T>(arr: T[], n: number): T[] {
  return arr.slice(-n)
}
function prior<T>(arr: T[], n: number): T[] {
  return arr.slice(-n * 2, -n)
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0)
const change = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0)

const labels = computed(() => tail(analyticsLabels, range.value))

/* Sessions and users are both counts of the same thing, so one axis is
   honest — no second scale is introduced. */
const trend = computed(() => [
  { name: 'Sessions', data: tail(analyticsSessions, range.value) },
  { name: 'Users', data: tail(analyticsUsers, range.value) },
])

const kpi = computed(() => {
  const n = range.value
  const s = tail(analyticsSessions, n)
  const u = tail(analyticsUsers, n)
  const b = tail(analyticsBounce, n)
  const d = tail(analyticsDuration, n)
  return {
    sessions: sum(s),
    sessionsDelta: change(sum(s), sum(prior(analyticsSessions, n))),
    users: sum(u),
    usersDelta: change(sum(u), sum(prior(analyticsUsers, n))),
    bounce: avg(b),
    bounceDelta: change(avg(b), avg(prior(analyticsBounce, n))),
    duration: avg(d),
    durationDelta: change(avg(d), avg(prior(analyticsDuration, n))),
  }
})

const deviceSeries = computed(() => [
  { name: 'Sessions', data: analyticsDevices.map(d => d.value) },
])
const deviceLabels = analyticsDevices.map(d => d.name)

/* Biggest movers first — direction is always spelled out with an icon and
   a sign, colour only reinforces it. */
const movers = computed(() =>
  [...analyticsAcquisition].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)))

const pageColumns = [
  { key: 'title', label: 'Page', width: '20rem' },
  { key: 'views', label: 'Views', align: 'end' as const },
  { key: 'uniques', label: 'Unique', align: 'end' as const },
  { key: 'avgSeconds', label: 'Avg. time', align: 'end' as const, nowrap: true },
  { key: 'bounce', label: 'Bounce', align: 'end' as const },
  { key: 'delta', label: 'Change', align: 'end' as const, nowrap: true },
]

const int = (n: number) => groupInt(Math.round(n))
const secs = (s: number) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`
const pct = (n: number) => `${n.toFixed(1)}%`
const signed = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Analytics</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Traffic and engagement, resliced from the last {{ ANALYTICS_DAYS }} days of collection.
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
        label="Sessions"
        :value="kpi.sessions"
        :delta="kpi.sessionsDelta"
        icon="lucide:mouse-pointer-click"
        :format="n => formatCompact(n)"
        :sparkline="trend[0]!.data"
      />
      <GorgStatTile
        label="Users"
        :value="kpi.users"
        :delta="kpi.usersDelta"
        icon="lucide:users"
        :format="n => formatCompact(n)"
        :sparkline="trend[1]!.data"
      />
      <GorgStatTile
        label="Bounce rate"
        :value="kpi.bounce"
        :delta="kpi.bounceDelta"
        invert
        icon="lucide:undo-2"
        :format="pct"
      />
      <GorgStatTile
        label="Avg. session"
        :value="kpi.duration"
        :delta="kpi.durationDelta"
        icon="lucide:timer"
        :format="secs"
      />
    </div>

    <GorgCard>
      <GorgChartFrame
        title="Sessions and users"
        :subtitle="`Daily, last ${range} days`"
        :series="trend"
        :labels="labels"
        :height="300"
      >
        <GorgLineChart
          :series="trend"
          :labels="labels"
          area
          :height="300"
          :show-markers="range <= 30"
          :format="n => formatCompact(n)"
        />
      </GorgChartFrame>
    </GorgCard>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard :padded="false" class="lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Top pages</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Ranked by views across the full window.</p>
          </div>
          <GorgButton variant="outline" size="xs">
            <template #lead>
              <Icon name="lucide:external-link" class="size-3.5" />
            </template>
            Open report
          </GorgButton>
        </div>

        <GorgTable :columns="pageColumns" :rows="analyticsTopPages" row-key="path" hoverable>
          <template #cell-title="{ row }">
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-strong)]">{{ row.title }}</p>
              <p class="truncate font-mono text-xs text-[var(--text-muted)]">{{ row.path }}</p>
            </div>
          </template>

          <template #cell-views="{ value }">
            <span class="tabular-nums">{{ int(value as number) }}</span>
          </template>

          <template #cell-uniques="{ value }">
            <span class="tabular-nums text-[var(--text-muted)]">{{ int(value as number) }}</span>
          </template>

          <template #cell-avgSeconds="{ value }">
            <span class="tabular-nums text-[var(--text-muted)]">{{ secs(value as number) }}</span>
          </template>

          <template #cell-bounce="{ value }">
            <span class="tabular-nums">{{ pct(value as number) }}</span>
          </template>

          <template #cell-delta="{ value }">
            <span
              class="inline-flex items-center gap-1 text-xs font-medium tabular-nums"
              :class="(value as number) >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="(value as number) >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ signed(value as number) }}
            </span>
          </template>
        </GorgTable>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame
          title="Acquisition"
          subtitle="Sessions by channel, full window"
          :series="analyticsAcquisition.map(a => ({ name: a.name, data: [a.sessions] }))"
          :labels="['Sessions']"
          :height="260"
        >
          <div class="grid place-items-center pt-1">
            <GorgDonutChart
              :data="analyticsAcquisition.map(a => ({ name: a.name, value: a.sessions }))"
              :size="196"
              center-label="Sessions"
            />
          </div>
        </GorgChartFrame>
      </GorgCard>
    </div>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <GorgCard>
        <GorgChartFrame
          title="Device split"
          subtitle="Sessions by device class"
          :series="deviceSeries"
          :labels="deviceLabels"
          :height="220"
        >
          <GorgBarChart
            :series="deviceSeries"
            :labels="deviceLabels"
            :height="220"
            :format="n => formatCompact(n)"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgWidgetRankedList
        title="Pages per session"
        :rows="analyticsDevicePages"
        :format="n => n.toFixed(1)"
      />

      <GorgCard>
        <template #title>
          Channel movers
        </template>
        <template #subtitle>
          Period over period, largest shift first
        </template>

        <ul class="-mx-1 divide-y divide-[var(--surface-border)]">
          <li
            v-for="c in movers"
            :key="c.name"
            class="flex items-center gap-3 px-1 py-2.5 first:pt-0 last:pb-0"
          >
            <span
              class="size-2.5 shrink-0 rounded-[3px]"
              :style="{ background: slotColor(analyticsAcquisition.findIndex(a => a.name === c.name)) }"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate text-sm text-[var(--text-strong)]">{{ c.name }}</span>
            <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
              {{ formatCompact(c.sessions) }}
            </span>
            <span
              class="inline-flex w-16 shrink-0 items-center justify-end gap-1 text-xs font-medium tabular-nums"
              :class="c.delta >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="c.delta >= 0 ? 'lucide:arrow-up-right' : 'lucide:arrow-down-right'"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ signed(c.delta) }}
            </span>
          </li>
        </ul>
      </GorgCard>
    </div>
  </div>
</template>
