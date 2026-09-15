<script setup lang="ts">
import type { FltAircraftState, FltStatus } from '~/utils/mock-media'
import { groupInt, slotColor } from '~/utils/chart'
import { dayLabel, timeLabel } from '~/utils/datetime'
import {
  FLT_DAYS,
  fltAircraftStateMeta,
  fltArrsByHour,
  fltBoard,
  fltCauseDaily,
  fltCauseDayLabels,
  fltCauses,
  fltDayLabels,
  fltDepsByHour,
  fltDisruptions,
  fltFleet,
  fltHourLabels,
  fltLoadFactorDaily,
  fltOnTimeDaily,
  fltPulse,
  fltStatusMeta,
} from '~/utils/mock-media'

useHead({ title: 'Flight operations' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const disruptionPanel = useTemplateRef<HTMLElement>('disruptionPanel')
useReveal(disruptionPanel, { y: 14 })

const charts = useTemplateRef<HTMLElement>('charts')
useStagger(charts, { each: 0.08 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.08 })

/* -- trends ---------------------------------------------------------------
   On-time and load factor are both percentages, so one axis is honest. */
const performance = [
  { name: 'On-time departures', data: fltOnTimeDaily },
  { name: 'Load factor', data: fltLoadFactorDaily },
]

/* Departures and arrivals are both movement counts — same axis, two series. */
const movements = [
  { name: 'Departures', data: fltDepsByHour },
  { name: 'Arrivals', data: fltArrsByHour },
]

/* -- delay causes ---------------------------------------------------------
   A cause keeps its slot in the stacked chart, in the legend, in the list
   beneath it and on any board row it explains. */
const causeSeries = fltCauses.map((c, i) => ({ name: c.name, data: fltCauseDaily[i] ?? [] }))
const causeMinutes = fltCauses.reduce((a, c) => a + c.minutes, 0)
const causeIndex = (id?: string) => (id ? fltCauses.findIndex(c => c.id === id) : -1)
const causeOf = (id?: string) => fltCauses.find(c => c.id === id)

/* -- board ---------------------------------------------------------------- */

const STATUS_RANK: Record<FltStatus, number> = {
  'cancelled': 0,
  'delayed': 1,
  'boarding': 2,
  'on-time': 3,
  'departed': 4,
}

const view = ref('all')
const viewItems = [
  { value: 'all', label: 'All' },
  { value: 'disrupted', label: 'Disrupted', icon: 'lucide:triangle-alert' },
  { value: 'boarding', label: 'Boarding', icon: 'lucide:door-open' },
  { value: 'on-time', label: 'On time', icon: 'lucide:circle-check' },
  { value: 'departed', label: 'Departed', icon: 'lucide:plane-takeoff' },
]

const {
  query,
  sortKey,
  sortDirection,
  visible: board,
  total,
  isFiltered,
  reset,
} = useCollection(fltBoard, {
  searchFields: ['flightNo', 'destination', 'destCode', 'gate', 'aircraft'],
  filters: {
    view: (f) => {
      if (view.value === 'all')
        return true
      if (view.value === 'disrupted')
        return f.status === 'delayed' || f.status === 'cancelled'
      return f.status === view.value
    },
  },
  initialSort: 'sched',
  initialDirection: 'asc',
  pageSize: 0,
  comparators: {
    // Alphabetical status is meaningless; rank by what an ops desk acts on first.
    status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  },
})

function clearAll() {
  reset()
  view.value = 'all'
}

const columns = [
  { key: 'flightNo', label: 'Flight', width: '9rem', nowrap: true, sortable: true },
  { key: 'destination', label: 'Destination', width: '13rem', nowrap: true, sortable: true },
  { key: 'gate', label: 'Gate', width: '5rem', nowrap: true, sortable: true },
  { key: 'sched', label: 'Scheduled', align: 'end' as const, width: '7rem', nowrap: true, sortable: true },
  { key: 'est', label: 'Estimated', align: 'end' as const, width: '8rem', nowrap: true },
  { key: 'status', label: 'Status', width: '15rem', sortable: true },
]

const delayed = fltBoard.filter(f => f.status === 'delayed').length
const cancelled = fltBoard.filter(f => f.status === 'cancelled').length

/* -- disruptions ---------------------------------------------------------- */

const severityMeta = {
  critical: { label: 'Acting now', tone: 'critical' as const, icon: 'lucide:octagon-alert' },
  caution: { label: 'Watching', tone: 'caution' as const, icon: 'lucide:triangle-alert' },
}

const affected = fltDisruptions.reduce((a, d) => a + d.pax, 0)
const rebooked = fltDisruptions.reduce((a, d) => a + d.rebooked, 0)

/* -- fleet ---------------------------------------------------------------- */

const stateOf = (s: string) => fltAircraftStateMeta[s as FltAircraftState]
const statusOf = (s: string) => fltStatusMeta[s as FltStatus]

/* -- formatters ----------------------------------------------------------- */

const pct = (n: number) => `${n.toFixed(1)}%`
const mins = (n: number) => `${groupInt(n)} min`
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Flight operations</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ dayLabel(0) }} · {{ fltPulse.flights }} rotations to
          {{ fltPulse.destinations }} destinations, {{ groupInt(fltPulse.passengers) }} passengers booked.
        </p>
      </div>

      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:radar" class="size-4" />
          </template>
          Live map
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:clipboard-list" class="size-4" />
          </template>
          Day plan
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="On-time performance"
        :value="fltPulse.onTime"
        :delta="fltPulse.onTimeDelta"
        :decimals="1"
        icon="lucide:clock"
        :format="pct"
        :sparkline="fltOnTimeDaily"
      />
      <GorgStatTile
        label="Flights today"
        :value="fltPulse.flights"
        :delta="fltPulse.flightsDelta"
        icon="lucide:plane-takeoff"
        :format="n => String(Math.round(n))"
      />
      <GorgStatTile
        label="Load factor"
        :value="fltPulse.loadFactor"
        :delta="fltPulse.loadFactorDelta"
        :decimals="1"
        icon="lucide:armchair"
        :format="pct"
        :sparkline="fltLoadFactorDaily"
      />
      <GorgStatTile
        label="Open disruptions"
        :value="fltPulse.disruptions"
        :delta="fltPulse.disruptionsDelta"
        invert
        icon="lucide:triangle-alert"
        :format="n => String(Math.round(n))"
      />
    </div>

    <!-- disruptions: the one panel that should interrupt you -->
    <div ref="disruptionPanel" class="js-reveal min-w-0">
      <GorgCard
        :padded="false"
        elevation="float"
        class="overflow-hidden border-[color-mix(in_oklch,var(--color-critical)_45%,var(--surface-border))]"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)]
                 bg-[color-mix(in_oklch,var(--color-critical)_8%,transparent)] px-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-field
                     bg-[color-mix(in_oklch,var(--color-critical)_16%,transparent)] text-[var(--color-critical)]"
            >
              <Icon name="lucide:octagon-alert" class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h2 class="truncate text-sm font-semibold text-[var(--text-strong)]">
                Disruptions need a decision
              </h2>
              <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {{ groupInt(affected) }} passengers affected · {{ groupInt(rebooked) }} reprotected so far
              </p>
            </div>
          </div>

          <GorgButton variant="danger" size="sm">
            <template #lead>
              <Icon name="lucide:siren" class="size-4" />
            </template>
            Open ops bridge
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="d in fltDisruptions"
            :key="d.id"
            class="flex flex-col gap-3 px-4 py-3.5 transition-colors duration-(--duration-snap)
                   hover:bg-[var(--surface-sunken)] lg:flex-row lg:items-center"
          >
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <Icon
                :name="severityMeta[d.severity].icon"
                class="mt-0.5 size-4 shrink-0"
                :class="d.severity === 'critical'
                  ? 'text-[var(--color-critical)]'
                  : 'text-[var(--color-caution)]'"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-sm font-semibold text-[var(--text-strong)]">{{ d.flightNo }}</span>
                  <span class="text-sm font-medium text-[var(--text-strong)]">{{ d.headline }}</span>
                  <GorgBadge :tone="severityMeta[d.severity].tone" size="xs">
                    <Icon :name="severityMeta[d.severity].icon" class="size-3" aria-hidden="true" />
                    {{ severityMeta[d.severity].label }}
                  </GorgBadge>
                </p>
                <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ d.detail }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span class="inline-flex items-center gap-1.5">
                    <span
                      class="size-2 rounded-[3px]"
                      :style="{ background: slotColor(causeIndex(d.cause)) }"
                      aria-hidden="true"
                    />
                    {{ causeOf(d.cause)?.name }}
                  </span>
                  <span>{{ d.owner }}</span>
                  <span class="tabular-nums">since {{ timeLabel(d.since) }}</span>
                </p>
              </div>
            </div>

            <div class="w-full shrink-0 ps-7 lg:w-56 lg:ps-0">
              <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span class="text-[var(--text-muted)]">Reprotected</span>
                <span class="font-medium tabular-nums text-[var(--text-strong)]">
                  {{ d.rebooked }} / {{ d.pax }}
                </span>
              </div>
              <GorgProgress
                :value="(d.rebooked / d.pax) * 100"
                size="xs"
                :tone="d.rebooked === 0 ? 'critical' : d.rebooked < d.pax ? 'caution' : 'positive'"
              />
            </div>
          </li>
        </ul>
      </GorgCard>
    </div>

    <div ref="charts" class="grid gap-4 lg:grid-cols-2">
      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="On-time performance and load factor"
          :subtitle="`Both percentages, last ${FLT_DAYS} days`"
          :series="performance"
          :labels="fltDayLabels"
          :height="280"
        >
          <GorgLineChart
            :series="performance"
            :labels="fltDayLabels"
            :height="280"
            :format="n => `${Math.round(n)}%`"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="Movements by hour"
          subtitle="Today's programme, off-block and on-block"
          :series="movements"
          :labels="fltHourLabels"
          :height="280"
        >
          <GorgBarChart
            :series="movements"
            :labels="fltHourLabels"
            :height="280"
            :format="n => String(Math.round(n))"
          />
        </GorgChartFrame>
      </GorgCard>
    </div>

    <!-- departures board -->
    <GorgCard :padded="false" class="min-w-0">
      <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
            <span class="relative flex size-2 shrink-0" aria-hidden="true">
              <span class="absolute inline-flex size-full animate-ping rounded-pill bg-tide-500 opacity-60" />
              <span class="relative inline-flex size-2 rounded-pill bg-tide-600" />
            </span>
            Departures
          </h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ total }} of {{ fltBoard.length }} rotations · {{ delayed }} delayed · {{ cancelled }} cancelled
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <GorgInput
            v-model="query"
            size="sm"
            icon="lucide:search"
            placeholder="Flight, city, gate or tail"
            clearable
            aria-label="Search departures"
            class="w-full sm:w-56"
          />
          <!-- scrolls rather than pushing the page wide on a narrow screen -->
          <div class="w-full overflow-x-auto sm:w-auto">
            <GorgSegmented v-model="view" :items="viewItems" size="xs" aria-label="Filter departures" />
          </div>
        </div>
      </div>

      <GorgTable
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :columns="columns"
        :rows="board"
        row-key="id"
        hoverable
      >
        <template #cell-flightNo="{ row }">
          <div class="min-w-0">
            <p class="font-mono text-sm font-semibold text-[var(--text-strong)]">{{ row.flightNo }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ row.type }} · {{ row.aircraft }}</p>

            <!-- On a phone the status column is scrolled off the card, and status
                 is the whole point of a departures board — repeat it here. -->
            <p class="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
              <GorgBadge :tone="statusOf(row.status).tone" size="xs">
                <Icon :name="statusOf(row.status).icon" class="size-3" aria-hidden="true" />
                {{ statusOf(row.status).label }}
              </GorgBadge>
              <span v-if="row.delayMin > 0" class="text-xs tabular-nums text-[var(--text-muted)]">
                +{{ row.delayMin }} min
              </span>
            </p>
          </div>
        </template>

        <template #cell-destination="{ row }">
          <div class="min-w-0">
            <p class="truncate text-sm text-[var(--text-strong)]">{{ row.destination }}</p>
            <p class="font-mono text-xs text-[var(--text-muted)]">
              {{ row.destCode }} · {{ row.pax }}/{{ row.seats }} seats
            </p>
          </div>
        </template>

        <template #cell-gate="{ row }">
          <span
            class="inline-flex min-w-11 justify-center rounded-field border border-[var(--surface-border)]
                   bg-[var(--surface-sunken)] px-2 py-1 font-mono text-xs font-semibold text-[var(--text-strong)]"
          >{{ row.gate }}</span>
        </template>

        <template #cell-sched="{ row }">
          <time
            :datetime="row.sched.toISOString()"
            class="text-sm tabular-nums"
            :class="row.status === 'cancelled'
              ? 'text-[var(--text-muted)] line-through'
              : 'text-[var(--text-strong)]'"
          >{{ timeLabel(row.sched) }}</time>
        </template>

        <template #cell-est="{ row }">
          <div class="text-end">
            <template v-if="row.status === 'cancelled'">
              <span class="text-sm text-[var(--text-muted)]">—</span>
            </template>
            <template v-else>
              <time
                :datetime="row.est.toISOString()"
                class="block text-sm font-medium tabular-nums"
                :class="row.delayMin > 0 ? 'text-[var(--color-caution)]' : 'text-[var(--text-strong)]'"
              >{{ timeLabel(row.est) }}</time>
              <span v-if="row.delayMin > 0" class="text-xs tabular-nums text-[var(--text-muted)]">
                +{{ row.delayMin }} min
              </span>
            </template>
          </div>
        </template>

        <!-- status is a word AND a glyph; colour only reinforces what is written -->
        <template #cell-status="{ row }">
          <div class="min-w-0">
            <GorgBadge :tone="statusOf(row.status).tone" size="xs">
              <Icon :name="statusOf(row.status).icon" class="size-3" aria-hidden="true" />
              {{ statusOf(row.status).label }}
            </GorgBadge>
            <p v-if="row.remark" class="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span
                v-if="row.cause"
                class="size-2 shrink-0 rounded-[3px]"
                :style="{ background: slotColor(causeIndex(row.cause)) }"
                aria-hidden="true"
              />
              <span class="truncate">{{ row.remark }}</span>
            </p>
          </div>
        </template>

        <template #empty>
          <GorgEmptyState
            icon="lucide:plane"
            title="Nothing on this filter"
            :description="isFiltered ? 'No rotation matches that search.' : 'No rotation is in this state right now.'"
          >
            <template #action>
              <GorgButton size="sm" variant="outline" @click="clearAll">
                Show the whole board
              </GorgButton>
            </template>
          </GorgEmptyState>
        </template>
      </GorgTable>
    </GorgCard>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <!-- delay causes -->
      <GorgCard class="min-w-0 lg:col-span-2">
        <GorgChartFrame
          title="Delay causes"
          :subtitle="`${mins(causeMinutes)} attributed today, across ${fltCauses.reduce((a, c) => a + c.flights, 0)} rotations`"
          :series="causeSeries"
          :labels="fltCauseDayLabels"
          :height="280"
        >
          <GorgBarChart
            :series="causeSeries"
            :labels="fltCauseDayLabels"
            stacked
            :height="280"
            :format="n => groupInt(n)"
          />
        </GorgChartFrame>

        <ul class="mt-4 space-y-2 border-t border-[var(--surface-border)] pt-4">
          <li v-for="(c, i) in fltCauses" :key="c.id" class="flex items-center gap-2.5 text-sm">
            <span class="size-2.5 shrink-0 rounded-[3px]" :style="{ background: slotColor(i) }" aria-hidden="true" />
            <Icon :name="c.icon" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate text-[var(--text-strong)]">{{ c.name }}</span>
            <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">{{ c.flights }} flights</span>
            <span class="w-20 shrink-0 text-end text-sm font-medium tabular-nums text-[var(--text-strong)]">
              {{ mins(c.minutes) }}
            </span>
          </li>
        </ul>
      </GorgCard>

      <!-- fleet -->
      <GorgCard class="min-w-0">
        <template #title>
          Aircraft utilisation
        </template>
        <template #subtitle>
          Block hours flown against today's plan
        </template>

        <ul class="space-y-4">
          <li v-for="ac in fltFleet" :key="ac.reg" class="min-w-0">
            <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p class="min-w-0 truncate font-mono text-sm font-medium text-[var(--text-strong)]">
                {{ ac.reg }}
                <span class="font-sans text-xs text-[var(--text-muted)]">{{ ac.type }}</span>
              </p>
              <p class="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                {{ ac.blockHours.toFixed(1) }}h
                <span class="font-normal text-[var(--text-muted)]">/ {{ ac.targetHours }}h</span>
              </p>
            </div>

            <div class="mt-1.5 h-2 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                :style="{
                  width: `${Math.min(100, (ac.blockHours / ac.targetHours) * 100)}%`,
                  background: slotColor(0),
                }"
              />
            </div>

            <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              <GorgBadge :tone="stateOf(ac.state).tone" size="xs">
                <Icon :name="stateOf(ac.state).icon" class="size-3" aria-hidden="true" />
                {{ stateOf(ac.state).label }}
              </GorgBadge>
              <span>stand {{ ac.stand }}</span>
              <span class="tabular-nums">{{ ac.sectors }} {{ ac.sectors === 1 ? 'sector' : 'sectors' }}</span>
              <span
                v-if="ac.turnaroundMin > 0"
                class="inline-flex items-center gap-1 tabular-nums"
                :class="ac.turnaroundMin > ac.targetTurnaroundMin ? 'font-medium text-[var(--color-caution)]' : ''"
              >
                <Icon
                  :name="ac.turnaroundMin > ac.targetTurnaroundMin ? 'lucide:alarm-clock' : 'lucide:check'"
                  class="size-3"
                  aria-hidden="true"
                />
                {{ ac.turnaroundMin }}m turn
                <span class="font-normal">
                  ({{ ac.turnaroundMin > ac.targetTurnaroundMin
                    ? `${ac.turnaroundMin - ac.targetTurnaroundMin} over`
                    : `${ac.targetTurnaroundMin - ac.turnaroundMin} under` }})
                </span>
              </span>
            </p>
          </li>
        </ul>
      </GorgCard>
    </div>
  </div>
</template>
