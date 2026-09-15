<script setup lang="ts">
import { formatCompact, groupInt, slotColor } from '~/utils/chart'
import { relativeLabel, shortDayLabel, timeLabel } from '~/utils/datetime'
import {
  COURSE_WEEKS,
  courseActiveCohorts,
  courseCatalog,
  courseCohorts,
  courseCompletions,
  courseEnrolments,
  courseFunnel,
  courseScores,
  courseSessions,
  courseTracks,
  courseWeekLabels,
} from '~/utils/mock-verticals'

useHead({ title: 'Course' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.07 })

/* -- headline numbers -----------------------------------------------------
   Four weeks against the four before them — the same comparison for every
   tile, so the deltas can be read against each other. */
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0)
const change = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0)

const recent = (a: number[]) => a.slice(-4)
const previous = (a: number[]) => a.slice(-8, -4)

const learners = sum(courseCatalog.map(c => c.learners))
const learnersDelta = change(avg(recent(courseEnrolments)), avg(previous(courseEnrolments)))

const completionRate = sum(recent(courseCompletions)) / Math.max(1, sum(recent(courseEnrolments)))
const completionPrior = sum(previous(courseCompletions)) / Math.max(1, sum(previous(courseEnrolments)))

const avgScore = avg(recent(courseScores))
const scoreDelta = change(avgScore, avg(previous(courseScores)))

const cohortsNow = courseActiveCohorts.at(-1) ?? 0
const cohortsDelta = change(avg(recent(courseActiveCohorts)), avg(previous(courseActiveCohorts)))

/* Both series count people, so a single axis is honest. */
const flow = [
  { name: 'Enrolments', data: courseEnrolments },
  { name: 'Completions', data: courseCompletions },
]

/* -- catalogue ------------------------------------------------------------ */
const trackFilter = ref('all')
const trackItems = [
  { label: 'All tracks', value: 'all' },
  ...courseTracks.map(t => ({ label: t, value: t })),
]

const { query, sortKey, sortDirection, page, pageSize, visible, total } = useCollection(courseCatalog, {
  searchFields: ['title', 'track', 'instructor'],
  filters: {
    track: row => trackFilter.value === 'all' || row.track === trackFilter.value,
  },
  initialSort: 'learners',
  initialDirection: 'desc',
  pageSize: 6,
})

// useCollection resets the page when the *query* narrows the list; a filter
// change has to say so itself, or you land on a page that no longer exists.
watch(trackFilter, () => { page.value = 1 })

const courseColumns = [
  { key: 'title', label: 'Course', width: '20rem', sortable: true },
  { key: 'instructor', label: 'Teaching', width: '13rem' },
  { key: 'modules', label: 'Modules', align: 'center' as const, sortable: true, nowrap: true },
  { key: 'progress', label: 'Median progress', width: '12rem', sortable: true },
  { key: 'learners', label: 'Learners', align: 'end' as const, sortable: true },
  { key: 'avgScore', label: 'Avg. score', align: 'end' as const, sortable: true },
  { key: 'updated', label: 'Updated', align: 'end' as const, sortable: true, nowrap: true },
]

/* Track slots are fixed by the declared order, so a track keeps its colour
   in the table dot and anywhere else it appears. */
const trackSlot = (track: string) =>
  slotColor(Math.max(0, (courseTracks as readonly string[]).indexOf(track)))

/* -- module drop-off ------------------------------------------------------ */
const cohortKey = ref(courseCohorts[0]!.key)
const cohortItems = courseCohorts.map(c => ({ value: c.key, label: c.label }))
const cohort = computed(() => courseCohorts.find(c => c.key === cohortKey.value) ?? courseCohorts[0]!)

const funnel = computed(() => courseFunnel.filter(s => s.cohort === cohortKey.value))

/* Module names do not fit an 8-tick axis on a phone, so the axis carries the
   position and the list below carries the name. */
const funnelLabels = computed(() => funnel.value.map(s => `M${s.order}`))
const funnelSeries = computed(() => [
  { name: 'Opened the module', data: funnel.value.map(s => s.reached) },
  { name: 'Finished it', data: funnel.value.map(s => s.completed) },
])

interface Stall {
  order: number
  module: string
  reached: number
  completed: number
  /** Opened the module and never finished it. */
  stalled: number
  stalledPct: number
  /** Never opened the module that follows. */
  exited: number
  exitedPct: number
}

const stalls = computed<Stall[]>(() => funnel.value.map((step, i) => {
  const next = funnel.value[i + 1]
  const exited = next ? step.reached - next.reached : 0
  return {
    order: step.order,
    module: step.module,
    reached: step.reached,
    completed: step.completed,
    stalled: step.reached - step.completed,
    stalledPct: step.reached ? (step.reached - step.completed) / step.reached : 0,
    exited,
    exitedPct: step.reached ? exited / step.reached : 0,
  }
}))

const worstStalls = computed(() => [...stalls.value].sort((a, b) => b.exited - a.exited).slice(0, 3))

const reachedFirst = computed(() => funnel.value[0]?.reached ?? 0)
const reachedLast = computed(() => funnel.value.at(-1)?.completed ?? 0)
const throughRate = computed(() => (reachedFirst.value ? reachedLast.value / reachedFirst.value : 0))

/* -- sessions ------------------------------------------------------------- */
const modeMeta: Record<string, { icon: string, tone: 'brand' | 'info' | 'neutral' }> = {
  'live': { icon: 'lucide:radio', tone: 'brand' },
  'lab': { icon: 'lucide:flask-conical', tone: 'info' },
  'office hours': { icon: 'lucide:messages-square', tone: 'neutral' },
}

/* -- formatting ----------------------------------------------------------- */
const int = (n: number) => groupInt(Math.round(n))
const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const score = (n: number) => `${n.toFixed(1)}%`
/* The stat tile counts whole numbers up, so a tile showing one decimal would be
   claiming precision the counter cannot carry. Round there, keep the decimal in
   the table where the value is static. */
const scoreTile = (n: number) => `${Math.round(n)}%`
const duration = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Learning</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ courseCatalog.length }} live courses. Roster totals, with every delta
          measured over the last four weeks against the four before them.
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:plus" class="size-4" />
        </template>
        New cohort
      </GorgButton>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Enrolled learners"
        :value="learners"
        :delta="learnersDelta"
        icon="lucide:users"
        :format="int"
        :sparkline="courseEnrolments"
      />
      <GorgStatTile
        label="Completion rate"
        :value="completionRate * 100"
        :delta="change(completionRate, completionPrior)"
        icon="lucide:circle-check-big"
        :format="scoreTile"
        :sparkline="courseCompletions"
      />
      <GorgStatTile
        label="Average score"
        :value="avgScore"
        :delta="scoreDelta"
        icon="lucide:target"
        :format="scoreTile"
        :sparkline="courseScores"
      />
      <GorgStatTile
        label="Active cohorts"
        :value="cohortsNow"
        :delta="cohortsDelta"
        icon="lucide:layers"
        :format="n => String(Math.round(n))"
        :sparkline="courseActiveCohorts"
      />
    </div>

    <GorgCard>
      <GorgChartFrame
        title="Enrolments and completions"
        :subtitle="`Weekly, last ${COURSE_WEEKS} weeks`"
        :series="flow"
        :labels="courseWeekLabels"
        :height="300"
      >
        <GorgLineChart
          :series="flow"
          :labels="courseWeekLabels"
          area
          :height="300"
          :format="n => formatCompact(n, 0)"
        />
      </GorgChartFrame>
    </GorgCard>

    <!-- catalogue -->
    <GorgCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">Course catalogue</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ total }} of {{ courseCatalog.length }} courses shown.
          </p>
        </div>
        <div class="flex w-full flex-wrap gap-2 sm:w-auto">
          <GorgInput
            v-model="query"
            placeholder="Course, track, instructor…"
            icon="lucide:search"
            size="sm"
            clearable
            class="w-full sm:w-56"
            aria-label="Search courses"
          />
          <GorgSelect
            v-model="trackFilter"
            :items="trackItems"
            size="sm"
            icon="lucide:funnel"
            class="w-full sm:w-44"
            aria-label="Filter by track"
          />
        </div>
      </div>

      <GorgTable
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :columns="courseColumns"
        :rows="visible"
        row-key="id"
        hoverable
      >
        <template #cell-title="{ row }">
          <div class="flex items-start gap-2.5">
            <span
              class="mt-1.5 size-2.5 shrink-0 rounded-[3px]"
              :style="{ background: trackSlot(row.track) }"
              aria-hidden="true"
            />
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-strong)]">{{ row.title }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">{{ row.track }} · {{ row.id }}</p>
            </div>
          </div>
        </template>

        <template #cell-instructor="{ row }">
          <div class="flex items-center gap-2">
            <GorgAvatar :name="row.instructor" size="sm" />
            <div class="min-w-0">
              <p class="truncate text-sm text-[var(--text-strong)]">{{ row.instructor }}</p>
              <GorgAvatarGroup
                v-if="row.assistants.length"
                :people="row.assistants.map((name: string) => ({ name }))"
                size="xs"
                :max="3"
                class="mt-1"
              />
              <p v-else class="text-xs text-[var(--text-muted)]">No assistants</p>
            </div>
          </div>
        </template>

        <template #cell-modules="{ row }">
          <span class="inline-flex items-center gap-1.5 text-sm tabular-nums text-[var(--text-muted)]">
            <Icon name="lucide:list-checks" class="size-3.5" aria-hidden="true" />
            {{ row.modulesDone }}/{{ row.modules }}
          </span>
        </template>

        <template #cell-progress="{ row }">
          <GorgProgress
            :value="row.progress"
            size="xs"
            :tone="row.progress >= 75 ? 'positive' : row.progress >= 50 ? 'brand' : 'caution'"
            show-value
            :label="`${row.modulesDone} of ${row.modules} modules`"
          />
        </template>

        <template #cell-learners="{ value }">
          <span class="tabular-nums text-[var(--text-strong)]">{{ int(value as number) }}</span>
        </template>

        <template #cell-avgScore="{ value }">
          <span class="tabular-nums text-[var(--text-muted)]">{{ score(value as number) }}</span>
        </template>

        <template #cell-updated="{ value }">
          <span class="text-xs text-[var(--text-muted)]">{{ relativeLabel(value as number) }}</span>
        </template>
      </GorgTable>

      <div class="border-t border-[var(--surface-border)] p-4">
        <GorgPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[6, 12]"
          unit="courses"
          label="Course pages"
        />
      </div>
    </GorgCard>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <!-- drop-off -->
      <GorgCard class="min-w-0 lg:col-span-2">
        <template #header>
          <GorgSegmented
            v-model="cohortKey"
            :items="cohortItems"
            variant="soft"
            aria-label="Cohort"
          />
        </template>
        <template #title>
          Where learners stall
        </template>
        <template #subtitle>
          {{ cohort.label }} · {{ int(reachedFirst) }} started, {{ pct(throughRate) }} finished the capstone
        </template>

        <GorgChartFrame
          title="Module funnel"
          subtitle="Opened versus finished, by module position"
          :series="funnelSeries"
          :labels="funnelLabels"
          :height="240"
        >
          <GorgBarChart
            :series="funnelSeries"
            :labels="funnelLabels"
            :height="240"
            :format="n => formatCompact(n, 0)"
          />
        </GorgChartFrame>

        <div class="mt-5 space-y-3 border-t border-[var(--surface-border)] pt-4">
          <h3 class="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Steepest exits
          </h3>
          <ul class="space-y-2.5">
            <li
              v-for="stall in worstStalls"
              :key="stall.order"
              class="flex flex-wrap items-center gap-x-3 gap-y-1.5"
            >
              <span class="grid size-7 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                M{{ stall.order }}
              </span>
              <span class="min-w-0 flex-1 truncate text-sm text-[var(--text-strong)]">{{ stall.module }}</span>
              <span class="text-xs tabular-nums text-[var(--text-muted)]">
                {{ int(stall.completed) }} of {{ int(stall.reached) }} finished
              </span>
              <!-- icon + explicit sign: the drop is legible without colour -->
              <span class="inline-flex w-28 shrink-0 items-center justify-end gap-1 text-xs font-medium tabular-nums text-[var(--color-caution)]">
                <Icon name="lucide:user-minus" class="size-3.5" aria-hidden="true" />
                −{{ int(stall.exited) }} next
              </span>
            </li>
          </ul>
        </div>
      </GorgCard>

      <!-- sessions -->
      <GorgCard :padded="false" class="min-w-0">
        <div class="border-b border-[var(--surface-border)] p-4">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">Upcoming sessions</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Live teaching across every cohort.</p>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li v-for="session in courseSessions" :key="session.id" class="p-4">
            <div class="flex items-start gap-3">
              <div class="w-14 shrink-0 text-center">
                <p class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                  <time :datetime="session.at.toISOString()">{{ timeLabel(session.at) }}</time>
                </p>
                <p class="text-[11px] text-[var(--text-muted)]">{{ shortDayLabel(session.at) }}</p>
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-[var(--text-strong)]">{{ session.title }}</p>
                <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {{ session.cohort }} · {{ duration(session.minutes) }} · {{ relativeLabel(session.at) }}
                </p>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <GorgBadge :tone="modeMeta[session.mode]!.tone" size="xs">
                    <Icon :name="modeMeta[session.mode]!.icon" class="size-3" aria-hidden="true" />
                    {{ session.mode }}
                  </GorgBadge>
                  <span class="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <GorgAvatar :name="session.host" size="xs" />
                    {{ session.host }}
                  </span>
                </div>

                <div class="mt-2.5">
                  <GorgProgress
                    :value="(session.booked / session.seats) * 100"
                    size="xs"
                    :tone="session.booked >= session.seats ? 'caution' : 'brand'"
                    :label="session.booked >= session.seats
                      ? `Full · ${session.booked} of ${session.seats} seats`
                      : `${session.booked} of ${session.seats} seats booked`"
                  />
                </div>
              </div>
            </div>
          </li>
        </ul>
      </GorgCard>
    </div>
  </div>
</template>
