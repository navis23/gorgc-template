<script setup lang="ts">
import type { DlvSeverity, DlvShipment, DlvStatus } from '~/utils/mock-ops'
import { formatCompact, formatCurrency, groupInt, slotColor } from '~/utils/chart'
import { relativeLabel, timeLabel } from '~/utils/datetime'
import {
  dlvCarriers,
  dlvDayLabels,
  dlvDelivered,
  dlvDispatched,
  dlvExceptions,
  dlvPulse,
  dlvShipments,
} from '~/utils/mock-ops'

useHead({ title: 'Delivery' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const exceptionPanel = useTemplateRef<HTMLElement>('exceptionPanel')
useReveal(exceptionPanel, { y: 14 })

const panels = useTemplateRef<HTMLElement>('panels')
useStagger(panels, { each: 0.08 })

/* Counters walk through integers, so rates ride in tenths and the formatter
   puts the point back — 942 renders as "94.2%". */
const rate = (n: number) => `${(n / 10).toFixed(1)}%`
const transit = (n: number) => `${(n / 10).toFixed(1)} days`
const money = (n: number) => formatCurrency(n, 0)

/* ----------------------------------------------------------------- volume */

/* Both series count shipments, so they share one axis honestly. */
const volumeSeries = [
  { name: 'Dispatched', data: dlvDispatched },
  { name: 'Delivered', data: dlvDelivered },
]

const dispatchedTotal = dlvDispatched.reduce((a, b) => a + b, 0)
const deliveredTotal = dlvDelivered.reduce((a, b) => a + b, 0)

/* --------------------------------------------------------------- carriers */

const carrierBooked = dlvCarriers.reduce((a, c) => a + c.used, 0)
const carrierCapacity = dlvCarriers.reduce((a, c) => a + c.capacity, 0)
/** Past this, a carrier has no slack left for a re-plan. */
const TIGHT = 0.95

/* -------------------------------------------------------------- shipments */

const statusMeta: Record<DlvStatus, {
  label: string
  tone: 'neutral' | 'info' | 'brand' | 'positive' | 'critical'
  icon: string
}> = {
  'picked-up': { label: 'Picked up', tone: 'neutral', icon: 'lucide:package-check' },
  'in-transit': { label: 'In transit', tone: 'info', icon: 'lucide:truck' },
  'out-for-delivery': { label: 'Out for delivery', tone: 'brand', icon: 'lucide:navigation' },
  'delivered': { label: 'Delivered', tone: 'positive', icon: 'lucide:circle-check' },
  'exception': { label: 'Exception', tone: 'critical', icon: 'lucide:triangle-alert' },
}

const moving: DlvStatus[] = ['picked-up', 'in-transit', 'out-for-delivery']

const view = ref('all')
const viewItems = [
  { value: 'all', label: 'All' },
  { value: 'moving', label: 'Moving', icon: 'lucide:truck' },
  { value: 'delivered', label: 'Delivered', icon: 'lucide:circle-check' },
  { value: 'exception', label: 'Exceptions', icon: 'lucide:triangle-alert' },
]

const {
  query,
  sortKey,
  sortDirection,
  visible: shipments,
  total,
  isFiltered,
  reset,
} = useCollection<DlvShipment>(dlvShipments, {
  searchFields: ['ref', 'origin', 'destination', 'carrier', 'originCode', 'destCode'],
  filters: {
    view: (s) => {
      if (view.value === 'all')
        return true
      if (view.value === 'moving')
        return moving.includes(s.status)
      return s.status === view.value
    },
  },
  initialSort: 'eta',
  initialDirection: 'asc',
  pageSize: 0,
})

function clearAll() {
  reset()
  view.value = 'all'
}

const columns = [
  { key: 'ref', label: 'Reference', width: '10rem', nowrap: true, sortable: true },
  { key: 'lane', label: 'Lane', width: '16rem' },
  { key: 'progress', label: 'Progress', width: '9rem' },
  { key: 'status', label: 'Status', width: '12rem', sortable: true },
  { key: 'eta', label: 'ETA', align: 'end' as const, width: '8rem', nowrap: true, sortable: true },
]

/* -------------------------------------------------------------- exceptions */

const severityMeta: Record<DlvSeverity, { label: string, tone: 'critical' | 'caution', icon: string }> = {
  critical: { label: 'Blocking', tone: 'critical', icon: 'lucide:octagon-alert' },
  caution: { label: 'Watch', tone: 'caution', icon: 'lucide:triangle-alert' },
}

const atRisk = dlvExceptions.reduce((a, e) => a + e.atRisk, 0)
const blocking = dlvExceptions.filter(e => e.severity === 'critical').length
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Delivery operations</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ groupInt(dlvPulse.active) }} consignments moving across {{ dlvPulse.lanes }} lanes.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:map" class="size-4" />
          </template>
          Lane map
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:package-plus" class="size-4" />
          </template>
          Book a load
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Active shipments"
        :value="dlvPulse.active"
        :delta="dlvPulse.activeDelta"
        icon="lucide:package"
        :format="n => groupInt(n)"
        :sparkline="dlvDispatched"
      />
      <GorgStatTile
        label="On-time rate"
        :value="dlvPulse.onTime * 1000"
        :delta="dlvPulse.onTimeDelta"
        icon="lucide:clock"
        :format="rate"
      />
      <GorgStatTile
        label="Average transit"
        :value="dlvPulse.transitDays * 10"
        :delta="dlvPulse.transitDelta"
        invert
        icon="lucide:route"
        :format="transit"
      />
      <GorgStatTile
        label="Open exceptions"
        :value="dlvPulse.exceptions"
        :delta="dlvPulse.exceptionsDelta"
        invert
        icon="lucide:triangle-alert"
        :format="n => String(Math.round(n))"
      />
    </div>

    <!-- exceptions: the one panel that should interrupt you -->
    <div ref="exceptionPanel" class="js-reveal">
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
                Exceptions need a decision
              </h2>
              <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {{ blocking }} blocking · {{ money(atRisk) }} of freight at risk
              </p>
            </div>
          </div>

          <GorgButton variant="danger" size="sm">
            <template #lead>
              <Icon name="lucide:siren" class="size-4" />
            </template>
            Open incident
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="issue in dlvExceptions"
            :key="issue.id"
            class="flex flex-col gap-3 px-4 py-3.5 transition-colors duration-(--duration-snap)
                   hover:bg-[var(--surface-sunken)] sm:flex-row sm:items-center"
          >
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <Icon
                :name="severityMeta[issue.severity].icon"
                class="mt-0.5 size-4 shrink-0"
                :class="issue.severity === 'critical'
                  ? 'text-[var(--color-critical)]'
                  : 'text-[var(--color-caution)]'"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-[var(--text-strong)]">{{ issue.reason }}</span>
                  <GorgBadge :tone="severityMeta[issue.severity].tone" size="xs">
                    <Icon :name="severityMeta[issue.severity].icon" class="size-3" aria-hidden="true" />
                    {{ severityMeta[issue.severity].label }}
                  </GorgBadge>
                </p>
                <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ issue.detail }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span class="font-mono">{{ issue.ref }}</span>
                  <span>{{ issue.lane }}</span>
                  <span>{{ issue.owner }}</span>
                </p>
              </div>
            </div>

            <dl class="flex shrink-0 items-center gap-6 ps-7 sm:ps-0">
              <div class="text-start sm:text-end">
                <dt class="text-xs text-[var(--text-muted)]">Held</dt>
                <dd class="text-sm font-medium tabular-nums text-[var(--text-strong)]">{{ issue.heldHours }}h</dd>
              </div>
              <div class="text-start sm:text-end">
                <dt class="text-xs text-[var(--text-muted)]">At risk</dt>
                <dd class="text-sm font-medium tabular-nums text-[var(--text-strong)]">
                  ${{ formatCompact(issue.atRisk) }}
                </dd>
              </div>
            </dl>
          </li>
        </ul>
      </GorgCard>
    </div>

    <div ref="panels" class="grid gap-4 lg:grid-cols-3">
      <!-- volume -->
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Shipment volume"
          :subtitle="`${groupInt(dispatchedTotal)} dispatched · ${groupInt(deliveredTotal)} delivered over ${dlvDayLabels.length} days`"
          :series="volumeSeries"
          :labels="dlvDayLabels"
          :height="300"
        >
          <GorgLineChart
            :series="volumeSeries"
            :labels="dlvDayLabels"
            :height="300"
            :format="n => groupInt(Math.round(n))"
          />
        </GorgChartFrame>
      </GorgCard>

      <!-- carrier utilisation -->
      <GorgCard>
        <template #title>
          Carrier utilisation
        </template>
        <template #subtitle>
          {{ groupInt(carrierBooked) }} of {{ groupInt(carrierCapacity) }} slots booked this week
        </template>

        <ul class="space-y-4">
          <li v-for="(carrier, i) in dlvCarriers" :key="carrier.name" class="min-w-0">
            <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ carrier.name }}</p>
              <p class="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                {{ ((carrier.used / carrier.capacity) * 100).toFixed(0) }}%
              </p>
            </div>

            <div class="mt-1.5 h-2 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                :style="{
                  width: `${Math.min(100, (carrier.used / carrier.capacity) * 100)}%`,
                  background: slotColor(i),
                }"
              />
            </div>

            <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              <span class="tabular-nums">{{ groupInt(carrier.used) }} / {{ groupInt(carrier.capacity) }}</span>
              <span class="tabular-nums">{{ (carrier.onTime * 100).toFixed(1) }}% on time</span>
              <GorgBadge v-if="carrier.used / carrier.capacity >= TIGHT" tone="caution" size="xs">
                <Icon name="lucide:triangle-alert" class="size-3" aria-hidden="true" />
                No slack
              </GorgBadge>
              <GorgBadge v-else size="xs">{{ carrier.lanes }} lanes</GorgBadge>
            </p>
          </li>
        </ul>
      </GorgCard>
    </div>

    <!-- live board -->
    <GorgCard :padded="false">
      <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
            <span class="relative flex size-2 shrink-0" aria-hidden="true">
              <span class="absolute inline-flex size-full animate-ping rounded-pill bg-tide-500 opacity-60" />
              <span class="relative inline-flex size-2 rounded-pill bg-tide-600" />
            </span>
            Shipment board
          </h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ total }} of {{ dlvShipments.length }} consignments · next ETA first
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <GorgInput
            v-model="query"
            size="sm"
            icon="lucide:search"
            placeholder="Reference, city or carrier"
            clearable
            aria-label="Search shipments"
            class="w-full sm:w-64"
          />
          <GorgSegmented
            v-model="view"
            :items="viewItems"
            size="sm"
            aria-label="Shipment status"
          />
        </div>
      </div>

      <GorgTable
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :columns="columns"
        :rows="shipments"
        row-key="id"
        hoverable
      >
        <template #cell-ref="{ row }">
          <div class="min-w-0">
            <p class="font-mono text-sm text-[var(--text-strong)]">{{ row.ref }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ row.service }} · {{ row.pieces }} pcs</p>
          </div>
        </template>

        <template #cell-lane="{ row }">
          <div class="min-w-0">
            <p class="flex min-w-0 items-center gap-1.5">
              <span class="truncate text-sm text-[var(--text-strong)]">{{ row.origin }}</span>
              <Icon name="lucide:arrow-right" class="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              <span class="truncate text-sm text-[var(--text-strong)]">{{ row.destination }}</span>
            </p>
            <p class="font-mono text-xs text-[var(--text-muted)]">
              {{ row.originCode }}–{{ row.destCode }} · {{ row.carrier }}
            </p>
          </div>
        </template>

        <template #cell-progress="{ row }">
          <div class="flex items-center gap-2">
            <div class="h-1.5 w-20 shrink-0 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                :class="row.status === 'exception' ? 'bg-[var(--color-critical)]' : 'bg-tide-500'"
                :style="{ width: `${Math.max(row.progress * 100, 3)}%` }"
              />
            </div>
            <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
              {{ (row.progress * 100).toFixed(0) }}%
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <div class="min-w-0">
            <GorgBadge :tone="statusMeta[row.status as DlvStatus].tone" size="xs">
              <Icon :name="statusMeta[row.status as DlvStatus].icon" class="size-3" aria-hidden="true" />
              {{ statusMeta[row.status as DlvStatus].label }}
            </GorgBadge>
            <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ row.lastScan }}</p>
          </div>
        </template>

        <template #cell-eta="{ row }">
          <div class="text-end">
            <time :datetime="row.eta.toISOString()" class="block text-sm tabular-nums text-[var(--text-strong)]">
              {{ timeLabel(row.eta) }}
            </time>
            <span
              class="text-xs"
              :class="row.status === 'exception' ? 'text-[var(--color-critical)]' : 'text-[var(--text-muted)]'"
            >
              {{ row.status === 'delivered' ? 'delivered' : relativeLabel(row.etaDay) }}
            </span>
          </div>
        </template>

        <template #empty>
          <GorgEmptyState
            icon="lucide:package-search"
            title="Nothing on this filter"
            :description="isFiltered ? 'No consignment matches that search.' : 'No consignment is in this state right now.'"
          >
            <template #action>
              <GorgButton size="sm" variant="outline" @click="clearAll">
                Show every shipment
              </GorgButton>
            </template>
          </GorgEmptyState>
        </template>
      </GorgTable>
    </GorgCard>
  </div>
</template>
