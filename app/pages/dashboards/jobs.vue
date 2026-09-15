<script setup lang="ts">
import type { AtsApplicant, AtsInterview, AtsRole, AtsStage } from '~/utils/mock-comms'
import { formatCompact, groupInt, slotColor } from '~/utils/chart'
import { dayLabel, isoDay, relativeLabel, timeLabel } from '~/utils/datetime'
import { ATS_STAGES, atsApplicants, atsInterviews, atsPulse, atsRoles } from '~/utils/mock-comms'

useHead({ title: 'Hiring' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.06 })

const pipelineCard = useTemplateRef<HTMLElement>('pipelineCard')
useReveal(pipelineCard, { y: 16 })

/* -- the drill ------------------------------------------------------------
   One selected role narrows every number on the page: the pipeline plots, the
   source mix, the applicant table and the interview list. Counts are derived
   from the same applicant list the table renders, so a headline can never
   disagree with the rows beneath it. */
const selectedRole = ref<string | null>(null)

const roleById = computed(() => new Map(atsRoles.map(r => [r.id, r])))
const roleTitle = (id: string) => roleById.value.get(id)?.title ?? 'Unknown role'

const byRole = computed(() => {
  const map = new Map<string, { total: number, fresh: number, offers: number }>()
  for (const role of atsRoles)
    map.set(role.id, { total: 0, fresh: 0, offers: 0 })
  for (const a of atsApplicants) {
    const entry = map.get(a.roleId)
    if (!entry)
      continue
    entry.total += 1
    if (a.appliedDays <= 7)
      entry.fresh += 1
    if (a.stage === 'Offer')
      entry.offers += 1
  }
  return map
})

function roleStats(id: string) {
  return byRole.value.get(id) ?? { total: 0, fresh: 0, offers: 0 }
}

function selectRole(id: string) {
  selectedRole.value = selectedRole.value === id ? null : id
}

/** Applicants after the role drill — the base for every derived figure. */
const scoped = computed(() =>
  selectedRole.value ? atsApplicants.filter(a => a.roleId === selectedRole.value) : atsApplicants)

const scopeLabel = computed(() =>
  selectedRole.value ? roleTitle(selectedRole.value) : 'all open roles')

/* -- pipeline -------------------------------------------------------------- */
function median(values: number[]): number {
  if (!values.length)
    return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const stageLabels = [...ATS_STAGES]

const pipeline = computed(() => stageLabels.map((stage) => {
  const inStage = scoped.value.filter(a => a.stage === stage)
  return {
    stage,
    count: inStage.length,
    days: median(inStage.map(a => a.daysInStage)),
  }
}))

const stageCounts = computed(() => pipeline.value.map(s => s.count))
const stageDays = computed(() => pipeline.value.map(s => s.days))

/* Two measures, two plots. Candidates are a count and time-in-stage is a
   duration — putting them on one pair of axes would invent a relationship
   between them that does not exist. */
const countSeries = computed(() => [{ name: 'Candidates', data: stageCounts.value }])
const daysSeries = computed(() => [{ name: 'Median days in stage', data: stageDays.value, color: slotColor(1) }])

const pipelineTotal = computed(() => scoped.value.length)
const slowestStage = computed(() =>
  [...pipeline.value].sort((a, b) => b.days - a.days)[0] ?? null)

/* -- source mix ------------------------------------------------------------ */
const sourceMix = computed(() => {
  const map = new Map<string, number>()
  for (const a of scoped.value)
    map.set(a.source, (map.get(a.source) ?? 0) + 1)
  // Fixed order, so a source keeps its colour slot when the drill changes.
  const order = ['Referral', 'Careers site', 'LinkedIn', 'Agency', 'Event']
  return order
    .map(name => ({ name, value: map.get(name) ?? 0 }))
    .filter(s => s.value > 0)
})

/* -- applicant table ------------------------------------------------------- */
type StageFilter = 'all' | AtsStage

const stageFilter = ref<StageFilter>('all')
const stageFilterModel = computed<string>({
  get: () => stageFilter.value,
  set: (v) => { stageFilter.value = v as StageFilter },
})

const stageFilterItems = computed(() => [
  { value: 'all', label: `All ${pipelineTotal.value}` },
  ...pipeline.value.map(s => ({ value: s.stage, label: `${s.stage} ${s.count}` })),
])

// Reset the stage chip when the role drill changes — a stage that is empty for
// the newly picked role would otherwise leave an unexplained blank table.
watch(selectedRole, () => { stageFilter.value = 'all' })

const columns = [
  { key: 'name', label: 'Candidate', sortable: true, width: '17rem' },
  { key: 'roleId', label: 'Role', sortable: true },
  { key: 'stage', label: 'Stage', sortable: true, align: 'center' as const },
  { key: 'source', label: 'Source', sortable: true, nowrap: true },
  { key: 'score', label: 'Score', sortable: true, align: 'end' as const, width: '8rem' },
  { key: 'daysInStage', label: 'In stage', sortable: true, align: 'end' as const, nowrap: true },
  { key: 'appliedDays', label: 'Applied', sortable: true, nowrap: true },
]

const {
  query,
  sortKey,
  sortDirection,
  page,
  pageSize,
  visible,
  total,
  isFiltered,
} = useCollection(atsApplicants, {
  searchFields: ['name', 'location', 'recruiter', 'source'],
  filters: {
    role: a => !selectedRole.value || a.roleId === selectedRole.value,
    stage: a => stageFilter.value === 'all' || a.stage === stageFilter.value,
  },
  initialSort: 'score',
  initialDirection: 'desc',
  pageSize: 8,
  comparators: {
    // Sorting by role should read alphabetically by title, not by opaque id.
    roleId: (a, b) => roleTitle(a.roleId).localeCompare(roleTitle(b.roleId)),
    // Stage is an ordered funnel, not an alphabet.
    stage: (a, b) => ATS_STAGES.indexOf(a.stage) - ATS_STAGES.indexOf(b.stage),
  },
})

/* -- interviews ------------------------------------------------------------ */
const scopedInterviews = computed(() =>
  selectedRole.value ? atsInterviews.filter(i => i.roleId === selectedRole.value) : atsInterviews)

const TODAY = isoDay(0)
const TOMORROW = isoDay(1)

function scheduleHeading(at: Date): string {
  const iso = isoDay(at)
  if (iso === TODAY)
    return 'Today'
  if (iso === TOMORROW)
    return 'Tomorrow'
  return dayLabel(at)
}

interface InterviewDay {
  iso: string
  heading: string
  items: AtsInterview[]
}

const interviewDays = computed<InterviewDay[]>(() => {
  const map = new Map<string, InterviewDay>()
  for (const i of scopedInterviews.value) {
    const iso = isoDay(i.at)
    let group = map.get(iso)
    if (!group) {
      group = { iso, heading: scheduleHeading(i.at), items: [] }
      map.set(iso, group)
    }
    group.items.push(i)
  }
  return [...map.values()].sort((a, b) => (a.iso < b.iso ? -1 : 1))
})

/* -- presentation maps ----------------------------------------------------- */
const stageMeta: Record<AtsStage, { tone: 'neutral' | 'info' | 'brand' | 'accent' | 'positive', icon: string }> = {
  'Applied': { tone: 'neutral', icon: 'lucide:inbox' },
  'Screen': { tone: 'info', icon: 'lucide:phone-call' },
  'Interview': { tone: 'brand', icon: 'lucide:messages-square' },
  'Onsite': { tone: 'accent', icon: 'lucide:building-2' },
  'Offer': { tone: 'positive', icon: 'lucide:file-signature' },
}

const roleStateMeta: Record<AtsRole['state'], { tone: 'brand' | 'info' | 'positive' | 'neutral', icon: string, label: string }> = {
  'open': { tone: 'brand', icon: 'lucide:door-open', label: 'Open' },
  'interviewing': { tone: 'info', icon: 'lucide:users', label: 'Interviewing' },
  'offer out': { tone: 'positive', icon: 'lucide:file-signature', label: 'Offer out' },
  'on hold': { tone: 'neutral', icon: 'lucide:pause', label: 'On hold' },
}

const sourceIcon: Record<string, string> = {
  'Referral': 'lucide:handshake',
  'Careers site': 'lucide:globe',
  'LinkedIn': 'lucide:linkedin',
  'Agency': 'lucide:briefcase',
  'Event': 'lucide:calendar-heart',
}

const kindIcon: Record<string, string> = {
  Screen: 'lucide:phone-call',
  Technical: 'lucide:terminal',
  Portfolio: 'lucide:image',
  Panel: 'lucide:users',
  Debrief: 'lucide:clipboard-check',
}

/** Score band. The numeral is always shown, so colour is never the only cue. */
function scoreBand(score: number): { tone: 'positive' | 'brand' | 'caution', word: string } {
  if (score >= 82)
    return { tone: 'positive', word: 'strong' }
  if (score >= 68)
    return { tone: 'brand', word: 'solid' }
  return { tone: 'caution', word: 'mixed' }
}

function panelPeople(i: AtsInterview) {
  return i.panel.map(name => ({ name }))
}

const offersOut = computed(() => scoped.value.filter(a => a.stage === 'Offer').length)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Hiring</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Requisitions, pipeline and interview load across {{ scopeLabel }}.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:calendar-plus" class="size-4" />
          </template>
          Schedule
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:plus" class="size-4" />
          </template>
          Open a role
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Roles accepting applicants"
        :value="atsPulse.openRoles"
        :delta="atsPulse.openRolesDelta"
        icon="lucide:briefcase"
        :sparkline="atsPulse.openRolesTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Candidates in pipeline"
        :value="atsPulse.activeCandidates"
        :delta="atsPulse.candidatesDelta"
        icon="lucide:users"
        :sparkline="atsPulse.applicantsTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Median time to hire"
        :value="atsPulse.medianTimeToHire"
        :delta="atsPulse.timeToHireDelta"
        icon="lucide:timer"
        invert
        :decimals="1"
        :sparkline="atsPulse.timeToHireTrend"
        :format="n => `${n.toFixed(1)} d`"
      />
      <GorgStatTile
        label="Offer acceptance"
        :value="atsPulse.offerAcceptance * 100"
        :delta="atsPulse.acceptanceDelta"
        icon="lucide:file-signature"
        :decimals="1"
        :sparkline="atsPulse.acceptanceTrend"
        :format="n => `${n.toFixed(1)}%`"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- open roles — the drill control -->
      <GorgCard :padded="false" class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Open roles</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              Pick a role to narrow the page.
            </p>
          </div>
          <GorgButton
            v-if="selectedRole"
            variant="ghost"
            size="xs"
            @click="selectedRole = null"
          >
            <template #lead>
              <Icon name="lucide:x" class="size-3.5" />
            </template>
            Clear
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li v-for="role in atsRoles" :key="role.id">
            <button
              type="button"
              class="w-full px-4 py-3 text-start transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
              :class="selectedRole === role.id && 'bg-tide-50 dark:bg-tide-900/30'"
              :aria-pressed="selectedRole === role.id"
              @click="selectRole(role.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-[var(--text-strong)]">
                    {{ role.title }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                    {{ role.team }} · {{ role.location }}
                  </p>
                </div>
                <div class="shrink-0 text-end">
                  <p class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                    {{ roleStats(role.id).total }}
                  </p>
                  <p class="text-[11px] text-[var(--text-muted)]">
                    {{ roleStats(role.id).total === 1 ? 'applicant' : 'applicants' }}
                  </p>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <GorgBadge :tone="roleStateMeta[role.state].tone" size="xs">
                  <Icon :name="roleStateMeta[role.state].icon" class="size-3" aria-hidden="true" />
                  {{ roleStateMeta[role.state].label }}
                </GorgBadge>
                <GorgBadge v-if="roleStats(role.id).fresh" tone="info" variant="outline" size="xs">
                  <Icon name="lucide:sparkles" class="size-3" aria-hidden="true" />
                  {{ roleStats(role.id).fresh }} new this week
                </GorgBadge>
                <GorgBadge v-if="roleStats(role.id).offers" tone="positive" variant="outline" size="xs">
                  <Icon name="lucide:file-signature" class="size-3" aria-hidden="true" />
                  {{ roleStats(role.id).offers }} at offer
                </GorgBadge>
              </div>

              <p class="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                <span>{{ role.seats }} {{ role.seats === 1 ? 'seat' : 'seats' }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ role.salaryBand }}</span>
                <span aria-hidden="true">·</span>
                <span>opened {{ relativeLabel(-role.openedDays) }}</span>
              </p>
            </button>
          </li>
        </ul>
      </GorgCard>

      <!-- pipeline: two measures, two plots -->
      <div ref="pipelineCard" class="js-reveal min-w-0 lg:col-span-2">
        <GorgCard class="min-w-0">
          <template #title>
            Hiring pipeline
          </template>
          <template #subtitle>
            {{ pipelineTotal }} candidates across {{ stageLabels.length }} stages · {{ scopeLabel }}
          </template>
          <template #header>
            <GorgBadge v-if="slowestStage && slowestStage.days > 0" tone="caution" size="xs">
              <Icon name="lucide:hourglass" class="size-3" aria-hidden="true" />
              Slowest: {{ slowestStage.stage }}
            </GorgBadge>
          </template>

          <div class="grid gap-6 xl:grid-cols-2">
            <div class="min-w-0">
              <GorgChartFrame
                title="Candidates by stage"
                subtitle="How many sit in each step today"
                :series="countSeries"
                :labels="stageLabels"
                :height="230"
              >
                <GorgBarChart
                  :series="countSeries"
                  :labels="stageLabels"
                  :height="230"
                  :format="n => groupInt(n)"
                />
              </GorgChartFrame>
            </div>

            <div class="min-w-0">
              <GorgChartFrame
                title="Time in stage"
                subtitle="Median days a candidate waits"
                :series="daysSeries"
                :labels="stageLabels"
                :height="230"
              >
                <GorgBarChart
                  :series="daysSeries"
                  :labels="stageLabels"
                  :height="230"
                  :format="n => `${n}d`"
                />
              </GorgChartFrame>
            </div>
          </div>

          <!-- the same two measures as text, so the shape is never the only reading -->
          <ul class="mt-5 grid gap-2 border-t border-[var(--surface-border)] pt-4 sm:grid-cols-2 xl:grid-cols-5">
            <li v-for="s in pipeline" :key="s.stage" class="min-w-0 rounded-field bg-[var(--surface-sunken)] px-3 py-2">
              <p class="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                <Icon :name="stageMeta[s.stage].icon" class="size-3.5" aria-hidden="true" />
                <span class="truncate">{{ s.stage }}</span>
              </p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">{{ s.count }}</p>
              <p class="text-[11px] tabular-nums text-[var(--text-muted)]">{{ s.days }}d median</p>
            </li>
          </ul>
        </GorgCard>
      </div>
    </div>

    <!-- applicants -->
    <div class="min-w-0">
      <GorgCard :padded="false" class="min-w-0">
        <div class="space-y-3 border-b border-[var(--surface-border)] p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-strong)]">Applicants</h2>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">
                {{ total }} showing · {{ scopeLabel }}
              </p>
            </div>
            <GorgInput
              v-model="query"
              placeholder="Search candidates…"
              icon="lucide:search"
              size="sm"
              clearable
              class="w-full sm:max-w-56"
            />
          </div>

          <div class="overflow-x-auto pb-0.5">
            <GorgSegmented
              v-model="stageFilterModel"
              :items="stageFilterItems"
              size="xs"
              aria-label="Filter by pipeline stage"
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
          <template #cell-name="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <GorgAvatar :name="(row as AtsApplicant).name" size="sm" />
              <div class="min-w-0">
                <p class="truncate font-medium text-[var(--text-strong)]">{{ (row as AtsApplicant).name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ (row as AtsApplicant).location }}</p>
              </div>
            </div>
          </template>

          <template #cell-roleId="{ row }">
            <button
              type="button"
              class="max-w-44 truncate text-start text-sm text-tide-700 underline-offset-2 hover:underline dark:text-tide-300"
              @click="selectRole((row as AtsApplicant).roleId)"
            >
              {{ roleTitle((row as AtsApplicant).roleId) }}
            </button>
          </template>

          <template #cell-stage="{ row }">
            <GorgBadge :tone="stageMeta[(row as AtsApplicant).stage].tone" size="xs">
              <Icon :name="stageMeta[(row as AtsApplicant).stage].icon" class="size-3" aria-hidden="true" />
              {{ (row as AtsApplicant).stage }}
            </GorgBadge>
          </template>

          <template #cell-source="{ row }">
            <span class="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <Icon
                :name="sourceIcon[(row as AtsApplicant).source] ?? 'lucide:globe'"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ (row as AtsApplicant).source }}
            </span>
          </template>

          <template #cell-score="{ row }">
            <div class="min-w-0">
              <p class="flex items-baseline justify-end gap-1.5">
                <span class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                  {{ (row as AtsApplicant).score }}
                </span>
                <span class="text-[11px] text-[var(--text-muted)]">
                  {{ scoreBand((row as AtsApplicant).score).word }}
                </span>
              </p>
              <GorgProgress
                :value="(row as AtsApplicant).score"
                :tone="scoreBand((row as AtsApplicant).score).tone"
                size="xs"
                class="mt-1.5"
              />
            </div>
          </template>

          <template #cell-daysInStage="{ row }">
            <span class="text-sm tabular-nums text-[var(--text-strong)]">
              {{ (row as AtsApplicant).daysInStage }}d
            </span>
          </template>

          <template #cell-appliedDays="{ row }">
            <span class="text-sm text-[var(--text-muted)]">
              {{ relativeLabel(-(row as AtsApplicant).appliedDays) }}
            </span>
          </template>

          <template #empty>
            <GorgEmptyState
              icon="lucide:user-search"
              title="No candidates here"
              :description="isFiltered
                ? 'Nothing matches that search in this stage.'
                : 'Nothing has reached this stage for the selected role yet.'"
            >
              <template #action>
                <GorgButton variant="outline" size="sm" @click="stageFilter = 'all'; selectedRole = null">
                  Clear filters
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
            unit="candidates"
            :page-sizes="[8, 16, 32]"
          />
        </div>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <!-- interview schedule -->
      <div class="min-w-0 lg:col-span-2">
        <GorgCard :padded="false" class="min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-strong)]">Interview schedule</h2>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">
                {{ scopedInterviews.length }} booked · {{ scopeLabel }}
              </p>
            </div>
            <GorgButton variant="ghost" size="xs">
              <template #lead>
                <Icon name="lucide:calendar" class="size-3.5" />
              </template>
              Calendar
            </GorgButton>
          </div>

          <div v-if="interviewDays.length" class="max-h-[30rem] overflow-y-auto">
            <section v-for="day in interviewDays" :key="day.iso">
              <h3
                class="border-b border-[var(--surface-border)] bg-[var(--surface-sunken)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
              >
                <time :datetime="day.iso">{{ day.heading }}</time>
              </h3>

              <ul class="divide-y divide-[var(--surface-border)]">
                <li v-for="i in day.items" :key="i.id" class="flex gap-3 px-4 py-3">
                  <div class="w-12 shrink-0 text-end">
                    <p class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                      {{ timeLabel(i.at) }}
                    </p>
                    <p class="text-[11px] tabular-nums text-[var(--text-muted)]">{{ i.minutes }}m</p>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ i.candidate }}</p>
                    <p class="truncate text-xs text-[var(--text-muted)]">{{ roleTitle(i.roleId) }}</p>

                    <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <GorgBadge size="xs">
                        <Icon :name="kindIcon[i.kind] ?? 'lucide:users'" class="size-3" aria-hidden="true" />
                        {{ i.kind }}
                      </GorgBadge>
                      <GorgBadge :tone="i.remote ? 'info' : 'accent'" variant="outline" size="xs">
                        <Icon :name="i.remote ? 'lucide:video' : 'lucide:building-2'" class="size-3" aria-hidden="true" />
                        {{ i.remote ? 'Video' : 'On-site' }}
                      </GorgBadge>
                      <GorgBadge v-if="i.unconfirmed" tone="caution" size="xs">
                        <Icon name="lucide:triangle-alert" class="size-3" aria-hidden="true" />
                        Unconfirmed
                      </GorgBadge>
                    </div>
                  </div>

                  <div class="shrink-0 self-center">
                    <GorgAvatarGroup :people="panelPeople(i)" :max="3" size="xs" />
                  </div>
                </li>
              </ul>
            </section>
          </div>

          <GorgEmptyState
            v-else
            size="sm"
            icon="lucide:calendar-x"
            title="Nothing booked"
            description="No interviews are scheduled for this role."
          />
        </GorgCard>
      </div>

      <!-- source mix -->
      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="Where candidates come from"
          :subtitle="`${pipelineTotal} applicants · ${offersOut} at offer`"
          :series="sourceMix.map(s => ({ name: s.name, data: [s.value] }))"
          :labels="['Candidates']"
          :height="230"
        >
          <div class="grid place-items-center pt-1">
            <GorgDonutChart
              :data="sourceMix"
              :size="176"
              center-label="Sourced"
              :format="n => formatCompact(n, 0)"
            />
          </div>
        </GorgChartFrame>
      </GorgCard>
    </div>
  </div>
</template>
