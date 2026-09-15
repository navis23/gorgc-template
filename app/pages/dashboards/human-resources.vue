<script setup lang="ts">
import type { HrPriority, HrReqStage, HrRequisition } from '~/utils/mock-ops'
import { groupInt, slotColor } from '~/utils/chart'
import { relativeLabel, shortDayLabel } from '~/utils/datetime'
import {
  hrAbsenceTrend,
  hrDepartments,
  hrFunnel,
  hrHeadcountTrend,
  hrLeaveStrip,
  hrLeaveUpcoming,
  hrOpenRolesTrend,
  hrPulse,
  hrRequisitions,
  hrTimeToHireTrend,
} from '~/utils/mock-ops'

useHead({ title: 'Human resources' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const panels = useTemplateRef<HTMLElement>('panels')
useStagger(panels, { each: 0.08 })

const leaveList = useTemplateRef<HTMLElement>('leaveList')
useStagger(leaveList, { each: 0.05, y: 12 })

const requisitionCard = useTemplateRef<HTMLElement>('requisitionCard')
useReveal(requisitionCard, { y: 16 })

/* Counters animate through integers, so a metric with a decimal is carried in
   tenths and divided in the formatter — 412 renders as "41.2 days". */
const days = (n: number) => `${(n / 10).toFixed(1)} days`
const percent = (n: number) => `${(n / 10).toFixed(1)}%`

/* ---------------------------------------------------------------- funnel */

const funnelPeak = hrFunnel[0]?.count ?? 1

const funnel = hrFunnel.map((stage, i) => {
  const previous = hrFunnel[i - 1]
  return {
    ...stage,
    color: slotColor(i),
    share: stage.count / funnelPeak,
    /** Pass-through from the stage before it. */
    step: previous ? stage.count / previous.count : 1,
  }
})

const funnelSeries = [{ name: 'Candidates', data: hrFunnel.map(s => s.count) }]
const funnelLabels = hrFunnel.map(s => s.name)
const hireRate = (hrFunnel.at(-1)?.count ?? 0) / funnelPeak

/* ------------------------------------------------------------ departments */

const departmentPeak = Math.max(...hrDepartments.map(d => d.headcount))
const departmentSeries = [{ name: 'Headcount', data: hrDepartments.map(d => d.headcount) }]
const departmentLabels = hrDepartments.map(d => d.name)

/* ------------------------------------------------------------------ leave */

const leavePeak = Math.max(...hrLeaveStrip.map(d => d.away), 1)
/** Above this many people out on one day, a team loses cover. */
const COVER_LIMIT = 12
const thinDays = hrLeaveStrip.filter(d => d.away > COVER_LIMIT).length

const leaveKindIcon: Record<string, string> = {
  Annual: 'lucide:palmtree',
  Parental: 'lucide:baby',
  Sick: 'lucide:thermometer',
  Study: 'lucide:graduation-cap',
  Sabbatical: 'lucide:tent-tree',
}

/* ----------------------------------------------------------- requisitions */

const stageMeta: Record<HrReqStage, { tone: 'neutral' | 'brand' | 'accent' | 'info' | 'positive' | 'caution', icon: string }> = {
  'Drafting': { tone: 'neutral', icon: 'lucide:pencil-line' },
  'Sourcing': { tone: 'info', icon: 'lucide:radar' },
  'Screening': { tone: 'brand', icon: 'lucide:list-filter' },
  'Interviewing': { tone: 'accent', icon: 'lucide:users' },
  'Offer': { tone: 'positive', icon: 'lucide:file-signature' },
  'On hold': { tone: 'caution', icon: 'lucide:pause' },
}

const priorityMeta: Record<HrPriority, { tone: 'critical' | 'caution' | 'neutral', icon: string }> = {
  Critical: { tone: 'critical', icon: 'lucide:flame' },
  High: { tone: 'caution', icon: 'lucide:chevron-up' },
  Normal: { tone: 'neutral', icon: 'lucide:minus' },
}

const stageFilter = ref('all')
const stageOptions = [
  { label: 'Every stage', value: 'all' },
  ...Object.keys(stageMeta).map(stage => ({ label: stage, value: stage })),
]

const {
  query,
  sortKey,
  sortDirection,
  visible: rows,
  total,
  isFiltered,
  reset,
} = useCollection<HrRequisition>(hrRequisitions, {
  searchFields: ['title', 'department', 'owner', 'location', 'id'],
  filters: {
    stage: r => stageFilter.value === 'all' || r.stage === stageFilter.value,
  },
  initialSort: 'applicants',
  initialDirection: 'desc',
  pageSize: 0,
})

const columns = [
  { key: 'title', label: 'Requisition', width: '20rem', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'owner', label: 'Panel', width: '11rem' },
  { key: 'applicants', label: 'Applicants', align: 'end' as const, sortable: true },
  { key: 'stage', label: 'Stage', align: 'center' as const, sortable: true },
  { key: 'priority', label: 'Priority', align: 'center' as const },
  { key: 'age', label: 'Open', align: 'end' as const, nowrap: true, sortable: true },
  { key: 'targetDay', label: 'Target start', align: 'end' as const, nowrap: true, sortable: true },
]

/** A requisition past this age needs a conversation, not a nudge. */
const STALE_DAYS = 45
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">People operations</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Headcount, hiring and cover across {{ hrDepartments.length }} departments.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:file-down" class="size-4" />
          </template>
          Headcount report
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:user-plus" class="size-4" />
          </template>
          Open a role
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Headcount"
        :value="hrPulse.headcount"
        :delta="hrPulse.headcountDelta"
        icon="lucide:users"
        :format="n => groupInt(n)"
        :sparkline="hrHeadcountTrend"
      />
      <GorgStatTile
        label="Open roles"
        :value="hrPulse.openRoles"
        :delta="hrPulse.openRolesDelta"
        invert
        icon="lucide:clipboard-list"
        :format="n => String(Math.round(n))"
        :sparkline="hrOpenRolesTrend"
      />
      <GorgStatTile
        label="Time to hire"
        :value="hrPulse.timeToHire * 10"
        :delta="hrPulse.timeToHireDelta"
        invert
        icon="lucide:timer"
        :format="days"
        :sparkline="hrTimeToHireTrend"
      />
      <GorgStatTile
        label="Absence rate"
        :value="hrPulse.absenceRate * 10"
        :delta="hrPulse.absenceDelta"
        invert
        icon="lucide:calendar-off"
        :format="percent"
        :sparkline="hrAbsenceTrend"
      />
    </div>

    <div ref="panels" class="grid gap-4 lg:grid-cols-3">
      <!-- hiring funnel -->
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Hiring funnel"
          :subtitle="`Rolling 90 days · ${(hireRate * 100).toFixed(1)}% of applicants signed`"
          :series="funnelSeries"
          :labels="funnelLabels"
          :height="290"
        >
          <ol class="space-y-3.5">
            <li v-for="(stage, i) in funnel" :key="stage.name" class="min-w-0">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p class="inline-flex min-w-0 items-center gap-2">
                  <Icon :name="stage.icon" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                  <span class="truncate text-sm font-medium text-[var(--text-strong)]">{{ stage.name }}</span>
                </p>
                <p class="flex shrink-0 items-baseline gap-2">
                  <span class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                    {{ groupInt(stage.count) }}
                  </span>
                  <span v-if="i > 0" class="text-xs tabular-nums text-[var(--text-muted)]">
                    {{ (stage.step * 100).toFixed(0) }}% carried
                  </span>
                </p>
              </div>

              <div class="mt-1.5 h-2.5 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
                <div
                  class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                  :style="{ width: `${Math.max(stage.share * 100, 2)}%`, background: stage.color }"
                />
              </div>

              <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ stage.note }}</p>
            </li>
          </ol>
        </GorgChartFrame>

        <template #footer>
          <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Offers out</dt>
              <dd class="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ hrPulse.offersOut }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Starting soon</dt>
              <dd class="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ hrPulse.startingSoon }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Joiners, quarter</dt>
              <dd class="mt-0.5 inline-flex items-baseline gap-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ hrPulse.joiners }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[var(--text-muted)]">Leavers, quarter</dt>
              <dd class="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ hrPulse.leavers }}
              </dd>
            </div>
          </dl>
        </template>
      </GorgCard>

      <!-- headcount by department -->
      <GorgCard>
        <GorgChartFrame
          title="Headcount by department"
          :subtitle="`${groupInt(hrPulse.headcount)} people · ${hrPulse.openRoles} roles open`"
          :series="departmentSeries"
          :labels="departmentLabels"
          :height="290"
        >
          <ul class="space-y-3">
            <li v-for="(department, i) in hrDepartments" :key="department.name" class="min-w-0">
              <div class="flex items-center gap-2 text-sm">
                <Icon :name="department.icon" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                <span class="truncate text-[var(--text-strong)]">{{ department.name }}</span>
                <span class="ms-auto shrink-0 font-medium tabular-nums text-[var(--text-strong)]">
                  {{ department.headcount }}
                </span>
              </div>

              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
                  <div
                    class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                    :style="{ width: `${(department.headcount / departmentPeak) * 100}%`, background: slotColor(i) }"
                  />
                </div>
                <span
                  class="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums"
                  :class="department.net >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
                >
                  <Icon
                    :name="department.net >= 0 ? 'lucide:arrow-up-right' : 'lucide:arrow-down-right'"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ department.net >= 0 ? '+' : '−' }}{{ Math.abs(department.net) }}
                </span>
              </div>
            </li>
          </ul>
        </GorgChartFrame>
      </GorgCard>
    </div>

    <div class="space-y-4">
      <!-- leave strip -->
      <GorgCard>
        <template #title>
          Who is away
        </template>
        <template #subtitle>
          Three weeks from {{ shortDayLabel(hrLeaveStrip[0]!.day) }}
        </template>
        <template #header>
          <GorgBadge :tone="thinDays ? 'caution' : 'positive'" size="xs">
            <Icon
              :name="thinDays ? 'lucide:triangle-alert' : 'lucide:circle-check'"
              class="size-3"
              aria-hidden="true"
            />
            {{ thinDays ? `${thinDays} days thin on cover` : 'Cover holds all month' }}
          </GorgBadge>
        </template>

        <div class="overflow-x-auto pb-1">
          <ol class="flex min-w-[36rem] items-end gap-1.5">
            <li
              v-for="day in hrLeaveStrip"
              :key="day.iso"
              class="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <Icon
                v-if="day.away > COVER_LIMIT"
                name="lucide:triangle-alert"
                class="size-3 text-[var(--color-caution)]"
                aria-hidden="true"
              />
              <span v-else class="size-3" aria-hidden="true" />

              <span class="text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                {{ day.weekend ? '—' : day.away }}
              </span>

              <div
                class="flex h-20 w-full items-end overflow-hidden rounded-field bg-[var(--surface-sunken)]"
                :class="day.today && 'ring-2 ring-tide-500'"
              >
                <div
                  class="w-full rounded-field transition-[height] duration-(--duration-slow)"
                  :class="day.away > COVER_LIMIT ? 'bg-[var(--color-caution)]' : 'bg-tide-500'"
                  :style="{ height: `${(day.away / leavePeak) * 100}%` }"
                />
              </div>

              <span class="text-[10px] text-[var(--text-muted)]">{{ day.weekday.slice(0, 1) }}</span>
              <time
                :datetime="day.iso"
                class="text-[10px] tabular-nums"
                :class="day.today ? 'font-semibold text-tide-700 dark:text-tide-300' : 'text-[var(--text-muted)]'"
              >
                {{ day.today ? 'Today' : day.label.split(' ')[1] }}
              </time>
            </li>
          </ol>
        </div>

        <template #footer>
          <ul class="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
            <li class="inline-flex items-center gap-1.5">
              <span class="size-2.5 rounded-[3px] bg-tide-500" aria-hidden="true" />
              People away
            </li>
            <li class="inline-flex items-center gap-1.5">
              <Icon name="lucide:triangle-alert" class="size-3.5 text-[var(--color-caution)]" aria-hidden="true" />
              More than {{ COVER_LIMIT }} away — cover is thin
            </li>
            <li class="inline-flex items-center gap-1.5">
              <span class="size-2.5 rounded-[3px] ring-2 ring-tide-500" aria-hidden="true" />
              Today
            </li>
          </ul>
        </template>
      </GorgCard>

      <!-- upcoming leave -->
      <GorgCard>
        <template #title>
          Booked leave
        </template>
        <template #subtitle>
          Starting in the next three weeks
        </template>

        <ul ref="leaveList" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="entry in hrLeaveUpcoming"
            :key="entry.id"
            class="flex items-start gap-3 rounded-card border border-[var(--surface-border)] bg-[var(--surface-sunken)] p-3"
          >
            <GorgAvatar :name="entry.person" size="sm" class="mt-0.5 shrink-0" />

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ entry.person }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">{{ entry.role }}</p>
              <p class="mt-1 flex flex-wrap items-center gap-1.5">
                <GorgBadge size="xs">
                  <Icon
                    :name="leaveKindIcon[entry.kind] ?? 'lucide:calendar'"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ entry.kind }}
                </GorgBadge>
                <span class="text-xs text-[var(--text-muted)]">
                  {{ entry.days }} days · cover {{ entry.cover }}
                </span>
              </p>
            </div>

            <p class="shrink-0 text-end">
              <time :datetime="`P${entry.startDay}D`" class="block text-xs font-medium text-[var(--text-strong)]">
                {{ shortDayLabel(entry.startDay) }}
              </time>
              <span class="text-xs text-[var(--text-muted)]">{{ relativeLabel(entry.startDay) }}</span>
            </p>
          </li>
        </ul>
      </GorgCard>
    </div>

    <!-- open requisitions -->
    <div ref="requisitionCard" class="js-reveal">
      <GorgCard :padded="false">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Open requisitions</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ total }} of {{ hrRequisitions.length }} shown · sorted by {{ sortKey ?? 'nothing' }}
            </p>
          </div>

          <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <GorgInput
              v-model="query"
              size="sm"
              icon="lucide:search"
              placeholder="Search roles, owners, cities"
              clearable
              aria-label="Search requisitions"
              class="w-full sm:w-64"
            />
            <GorgSelect
              v-model="stageFilter"
              :items="stageOptions"
              size="sm"
              aria-label="Filter by stage"
              class="w-full sm:w-44"
            />
          </div>
        </div>

        <GorgTable
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          :columns="columns"
          :rows="rows"
          row-key="id"
          striped
        >
          <template #cell-title="{ row }">
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-strong)]">{{ row.title }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">
                <span class="font-mono">{{ row.id }}</span> · {{ row.location }}
              </p>
            </div>
          </template>

          <template #cell-department="{ value }">
            <span class="text-sm text-[var(--text-muted)]">{{ value }}</span>
          </template>

          <template #cell-owner="{ row }">
            <div class="flex min-w-0 items-center gap-2">
              <GorgAvatarGroup :people="row.panel.map((name: string) => ({ name }))" size="xs" :max="3" />
              <span class="sr-only">{{ row.panel.join(', ') }}</span>
            </div>
          </template>

          <template #cell-applicants="{ row }">
            <div class="text-end">
              <p class="font-medium tabular-nums text-[var(--text-strong)]">{{ groupInt(row.applicants) }}</p>
              <p class="text-xs tabular-nums text-[var(--text-muted)]">{{ row.interviews }} interviewed</p>
            </div>
          </template>

          <template #cell-stage="{ value }">
            <GorgBadge :tone="stageMeta[value as HrReqStage].tone" size="xs">
              <Icon :name="stageMeta[value as HrReqStage].icon" class="size-3" aria-hidden="true" />
              {{ value }}
            </GorgBadge>
          </template>

          <template #cell-priority="{ value }">
            <GorgBadge :tone="priorityMeta[value as HrPriority].tone" size="xs" variant="outline">
              <Icon :name="priorityMeta[value as HrPriority].icon" class="size-3" aria-hidden="true" />
              {{ value }}
            </GorgBadge>
          </template>

          <template #cell-age="{ row }">
            <span
              class="inline-flex items-center gap-1 text-sm tabular-nums"
              :class="row.age > STALE_DAYS ? 'text-[var(--color-caution)]' : 'text-[var(--text-muted)]'"
            >
              <Icon
                v-if="row.age > STALE_DAYS"
                name="lucide:hourglass"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ row.age }}d
            </span>
          </template>

          <template #cell-targetDay="{ row }">
            <div class="text-end">
              <p class="text-sm tabular-nums text-[var(--text-strong)]">{{ shortDayLabel(row.targetDay) }}</p>
              <p class="text-xs text-[var(--text-muted)]">{{ relativeLabel(row.targetDay) }}</p>
            </div>
          </template>

          <template #empty>
            <GorgEmptyState
              icon="lucide:search-x"
              title="No requisitions match"
              :description="isFiltered ? 'Try a different search term or stage.' : 'Every role is filled.'"
            >
              <template #action>
                <GorgButton size="sm" variant="outline" @click="reset(); stageFilter = 'all'">
                  Clear filters
                </GorgButton>
              </template>
            </GorgEmptyState>
          </template>
        </GorgTable>
      </GorgCard>
    </div>
  </div>
</template>
