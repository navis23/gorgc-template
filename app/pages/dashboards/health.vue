<script setup lang="ts">
import type { HealthDoseState, HealthVital } from '~/utils/mock-verticals'
import { slotColor } from '~/utils/chart'
import { dayLabel, isoDay, relativeLabel, timeLabel } from '~/utils/datetime'
import {
  HEALTH_DAYS,
  healthCare,
  healthDayLabels,
  healthDoses,
  healthMetrics,
  healthSleepStages,
  healthVitals,
} from '~/utils/mock-verticals'

useHead({ title: 'Health' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.07 })

/* -- window ---------------------------------------------------------------
   Every trend on this page compares the chosen window against the window of
   the same length immediately before it — that is why more history is kept
   on file than any one view shows. */
const windowKey = ref('14')
const nights = computed(() => Number(windowKey.value))
const windowItems = [
  { value: '7', label: '7 nights' },
  { value: '14', label: '14 nights' },
  { value: '28', label: '28 nights' },
]

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const change = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0)

const labels = computed(() => healthDayLabels.slice(-nights.value))

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * The stat tile counts its value up as a whole number, so a mean of 7.56 hours
 * would land on "8.0 h" — precision the reading does not have and a number the
 * table below would contradict. Sleep is therefore carried in minutes and
 * formatted back to hours; everything else is honest at integer resolution.
 */
function tileFormat(key: string, unit: string) {
  if (key === 'sleep')
    return (n: number) => `${Math.floor(n / 60)}h ${pad2(Math.round(n % 60))}m`
  return (n: number) => `${Math.round(n)}${unit ? ` ${unit}` : ''}`
}

const metrics = computed(() => healthMetrics.map((metric) => {
  const cur = metric.history.slice(-nights.value)
  const prev = metric.history.slice(-nights.value * 2, -nights.value)
  const mean = avg(cur)
  return {
    ...metric,
    mean,
    tileValue: metric.key === 'sleep' ? mean * 60 : mean,
    tileFormat: tileFormat(metric.key, metric.unit),
    latest: metric.history.at(-1) ?? 0,
    delta: change(mean, avg(prev)),
    spark: cur,
  }
}))

/* -- recovery ------------------------------------------------------------- */
const recovery = computed(() => metrics.value.find(m => m.key === 'recovery'))
const recoveryScore = computed(() => recovery.value?.latest ?? 0)

const recoveryBand = computed(() => {
  const n = recoveryScore.value
  if (n >= 80) return { status: 'good' as const, word: 'Primed', icon: 'lucide:battery-full', copy: 'Train hard if you want to.' }
  if (n >= 65) return { status: 'good' as const, word: 'Ready', icon: 'lucide:battery-charging', copy: 'Normal load is well tolerated.' }
  if (n >= 50) return { status: 'warning' as const, word: 'Moderate', icon: 'lucide:battery-medium', copy: 'Keep intensity easy today.' }
  return { status: 'serious' as const, word: 'Strained', icon: 'lucide:battery-low', copy: 'Rest is the better call.' }
})

/* -- sleep ---------------------------------------------------------------- */
const sleepSeries = computed(() =>
  healthSleepStages.map(stage => ({ name: stage.name, data: stage.data.slice(-nights.value) })))

const timeInBed = computed(() =>
  avg(labels.value.map((_, i) => sleepSeries.value.reduce((sum, s) => sum + (s.data[i] ?? 0), 0))))

const stageShare = computed(() => {
  const totals = sleepSeries.value.map(s => ({ name: s.name, total: s.data.reduce((a, b) => a + b, 0) }))
  const all = totals.reduce((a, t) => a + t.total, 0) || 1
  return totals.map(t => ({ name: t.name, share: t.total / all }))
})

/* -- vitals --------------------------------------------------------------- */
type VitalState = 'in' | 'above' | 'below'

const stateMeta: Record<VitalState, {
  word: string
  icon: string
  tone: 'positive' | 'caution' | 'info'
}> = {
  in: { word: 'In range', icon: 'lucide:circle-check', tone: 'positive' },
  above: { word: 'Above range', icon: 'lucide:arrow-up', tone: 'caution' },
  below: { word: 'Below range', icon: 'lucide:arrow-down', tone: 'info' },
}

/** Template-facing lookup — keeps type assertions out of the markup. */
function stateInfo(state: string) {
  return stateMeta[state as VitalState] ?? stateMeta.in
}

function stateOf(vital: HealthVital): VitalState {
  if (vital.value > vital.high) return 'above'
  if (vital.value < vital.low) return 'below'
  return 'in'
}

/**
 * Where a reading sits against its reference interval, as percentages of a
 * padded domain. Pure arithmetic — nothing is measured from the DOM, so the
 * server and the client draw the same meter.
 */
function meter(vital: HealthVital) {
  const lo = Math.min(vital.low, vital.value)
  const hi = Math.max(vital.high, vital.value)
  const pad = (hi - lo) * 0.25 || 1
  const min = lo - pad
  const max = hi + pad
  const at = (n: number) => Math.round(((n - min) / (max - min)) * 1000) / 10
  return { start: at(vital.low), width: at(vital.high) - at(vital.low), marker: at(vital.value) }
}

const vitalRows = computed(() => healthVitals.map(v => ({
  ...v,
  state: stateOf(v),
  meter: meter(v),
})))

const outOfRange = computed(() => vitalRows.value.filter(v => v.state !== 'in'))

const vitalColumns = [
  { key: 'name', label: 'Measure', width: '14rem' },
  { key: 'value', label: 'Latest', align: 'end' as const, nowrap: true },
  { key: 'range', label: 'Reference', align: 'end' as const, nowrap: true },
  { key: 'meter', label: 'Against range', width: '12rem' },
  { key: 'state', label: 'Status', align: 'start' as const, nowrap: true },
  { key: 'sampled', label: 'Sampled', align: 'end' as const, nowrap: true },
]

const num = (n: number, decimals: number) => n.toFixed(decimals)

/* -- care ----------------------------------------------------------------- */
const careMeta: Record<string, { icon: string, tone: 'brand' | 'info' | 'positive' }> = {
  appointment: { icon: 'lucide:stethoscope', tone: 'brand' },
  lab: { icon: 'lucide:test-tube', tone: 'info' },
  review: { icon: 'lucide:clipboard-list', tone: 'positive' },
}

const careItems = computed(() => healthCare.map(event => ({
  id: event.id,
  title: event.title,
  description: [event.place, event.note].filter(Boolean).join(' — '),
  icon: event.done ? 'lucide:check' : careMeta[event.kind]!.icon,
  tone: event.done ? ('neutral' as const) : careMeta[event.kind]!.tone,
  at: event.at,
  meta: event.who,
})))

const nextVisit = computed(() => healthCare.find(e => !e.done))

/* -- medication ----------------------------------------------------------- */
const doseMeta: Record<HealthDoseState, {
  word: string
  icon: string
  tone: 'positive' | 'info' | 'critical' | 'neutral'
}> = {
  taken: { word: 'Taken', icon: 'lucide:check-check', tone: 'positive' },
  due: { word: 'Due now', icon: 'lucide:bell-ring', tone: 'info' },
  missed: { word: 'Missed', icon: 'lucide:circle-alert', tone: 'critical' },
  scheduled: { word: 'Scheduled', icon: 'lucide:clock', tone: 'neutral' },
}

const takenToday = computed(() => healthDoses.filter(d => d.state === 'taken').length)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Wellbeing</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ HEALTH_DAYS }} nights on file. Each trend compares the selected window
          against the window of the same length before it.
        </p>
      </div>

      <GorgSegmented
        v-model="windowKey"
        :items="windowItems"
        variant="pill"
        aria-label="Comparison window"
        class="shrink-0"
      />
    </header>

    <!-- out-of-range banner: the word does the work, the colour agrees -->
    <GorgAlert
      v-if="outOfRange.length"
      tone="caution"
      icon="lucide:triangle-alert"
      :title="`${outOfRange.length} of ${vitalRows.length} vitals sit outside their reference interval`"
    >
      {{ outOfRange.map(v => v.name).join(', ') }} — flagged for the next clinical review.
    </GorgAlert>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        v-for="metric in metrics"
        :key="metric.key"
        :label="metric.label"
        :value="metric.tileValue"
        :delta="metric.delta"
        :invert="metric.lowerIsBetter"
        :icon="metric.icon"
        :format="metric.tileFormat"
        :sparkline="metric.spark"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="min-w-0 lg:col-span-2">
        <GorgChartFrame
          title="Sleep stages"
          :subtitle="`Time in bed per night, last ${nights} nights · ${timeInBed.toFixed(1)} h average`"
          :series="sleepSeries"
          :labels="labels"
          :height="280"
        >
          <GorgBarChart
            :series="sleepSeries"
            :labels="labels"
            stacked
            :height="280"
            :format="n => `${n.toFixed(1)}h`"
          />
        </GorgChartFrame>

        <ul class="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--surface-border)] pt-4 sm:grid-cols-4">
          <li v-for="(stage, i) in stageShare" :key="stage.name">
            <p class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span class="size-2.5 rounded-[3px]" :style="{ background: slotColor(i) }" aria-hidden="true" />
              {{ stage.name }}
            </p>
            <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
              {{ (stage.share * 100).toFixed(1) }}%
            </p>
          </li>
        </ul>
      </GorgCard>

      <GorgCard class="min-w-0">
        <template #title>
          Recovery
        </template>
        <template #subtitle>
          Last night's score, against the {{ nights }}-night average
        </template>

        <div class="grid place-items-center">
          <GorgGauge
            :value="recoveryScore"
            :max="100"
            label="Recovery"
            :status="recoveryBand.status"
            :size="176"
            :format="n => String(Math.round(n))"
          />
        </div>

        <!-- state is named, not merely coloured -->
        <p class="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-strong)]">
          <Icon :name="recoveryBand.icon" class="size-4" aria-hidden="true" />
          {{ recoveryBand.word }}
        </p>
        <p class="mt-1 text-center text-xs text-[var(--text-muted)]">{{ recoveryBand.copy }}</p>

        <template #footer>
          <dl class="grid grid-cols-2 gap-3 text-center">
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Window average</dt>
              <dd class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                {{ Math.round(recovery?.mean ?? 0) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Time in bed</dt>
              <dd class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                {{ timeInBed.toFixed(1) }} h
              </dd>
            </div>
          </dl>
        </template>
      </GorgCard>
    </div>

    <!-- vitals -->
    <GorgCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">Vitals and labs</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            Latest reading per measure, with its reference interval.
          </p>
        </div>
        <GorgButton variant="outline" size="xs">
          <template #lead>
            <Icon name="lucide:download" class="size-3.5" />
          </template>
          Export for clinic
        </GorgButton>
      </div>

      <GorgTable :columns="vitalColumns" :rows="vitalRows" row-key="name" hoverable>
        <template #cell-name="{ row }">
          <div class="min-w-0">
            <p class="truncate font-medium text-[var(--text-strong)]">{{ row.name }}</p>
            <p class="truncate text-xs text-[var(--text-muted)]">{{ row.source }}</p>
          </div>
        </template>

        <template #cell-value="{ row }">
          <span class="tabular-nums font-medium text-[var(--text-strong)]">
            {{ num(row.value, row.decimals) }}
            <span class="text-xs font-normal text-[var(--text-muted)]">{{ row.unit }}</span>
          </span>
        </template>

        <template #cell-range="{ row }">
          <span class="text-xs tabular-nums text-[var(--text-muted)]">
            {{ num(row.low, row.decimals) }}–{{ num(row.high, row.decimals) }} {{ row.unit }}
          </span>
        </template>

        <!-- the marker leaving the banded stretch says "outside" on its own -->
        <template #cell-meter="{ row }">
          <div class="relative h-2 w-full min-w-28 rounded-pill bg-[var(--surface-sunken)]">
            <span
              class="absolute inset-y-0 rounded-pill bg-[color-mix(in_oklch,var(--color-positive)_28%,transparent)]"
              :style="{ left: `${row.meter.start}%`, width: `${row.meter.width}%` }"
              aria-hidden="true"
            />
            <span
              class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-[var(--surface-raised)]"
              :class="row.state === 'in' ? 'bg-[var(--text-strong)]' : 'bg-[var(--color-caution)]'"
              :style="{ left: `${row.meter.marker}%` }"
              aria-hidden="true"
            />
          </div>
        </template>

        <template #cell-state="{ row }">
          <GorgBadge :tone="stateInfo(row.state).tone" size="sm">
            <Icon :name="stateInfo(row.state).icon" class="size-3.5" aria-hidden="true" />
            {{ stateInfo(row.state).word }}
          </GorgBadge>
        </template>

        <template #cell-sampled="{ value }">
          <span class="text-xs text-[var(--text-muted)]">
            <time :datetime="isoDay(value as number)">{{ relativeLabel(value as number) }}</time>
          </span>
        </template>
      </GorgTable>
    </GorgCard>

    <div ref="lower" class="grid gap-4 lg:grid-cols-5">
      <!-- medication -->
      <GorgCard :padded="false" class="min-w-0 lg:col-span-2">
        <div class="flex items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Today's medication</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ takenToday }} of {{ healthDoses.length }} doses taken.
            </p>
          </div>
          <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
            {{ dayLabel(0) }}
          </span>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li v-for="dose in healthDoses" :key="dose.id" class="flex items-center gap-3 p-4">
            <span class="w-12 shrink-0 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
              <time :datetime="dose.at.toISOString()">{{ timeLabel(dose.at) }}</time>
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">
                {{ dose.drug }} <span class="font-normal text-[var(--text-muted)]">{{ dose.dose }}</span>
              </p>
              <p class="truncate text-xs text-[var(--text-muted)]">
                {{ dose.purpose }}<span v-if="dose.withFood"> · with food</span>
              </p>
            </div>

            <GorgBadge :tone="doseMeta[dose.state].tone" size="xs" class="shrink-0">
              <Icon :name="doseMeta[dose.state].icon" class="size-3" aria-hidden="true" />
              {{ doseMeta[dose.state].word }}
            </GorgBadge>
          </li>
        </ul>
      </GorgCard>

      <!-- care schedule -->
      <GorgCard class="min-w-0 lg:col-span-3">
        <template #title>
          Care schedule
        </template>
        <template #subtitle>
          <span v-if="nextVisit">
            Next: {{ nextVisit.title }}, {{ relativeLabel(nextVisit.at) }}
          </span>
          <span v-else>Nothing booked</span>
        </template>

        <GorgTimeline :items="careItems" />
      </GorgCard>
    </div>
  </div>
</template>
