<script setup lang="ts">
import type { Milestone, RiskItem } from '~/utils/mock'
import {
  projectActivity,
  projectBoard,
  projectBurndownActual,
  projectBurndownIdeal,
  projectMilestones,
  projectRisks,
  projectSprintLabels,
  projectWorkload,
  SPRINT_DAYS,
} from '~/utils/mock'

useHead({ title: 'Project' })

const board = useTemplateRef<HTMLElement>('board')
useStagger(board, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.08 })

/* Both series are story points remaining, so one axis tells the truth. */
const burndown = [
  { name: 'Remaining', data: projectBurndownActual },
  { name: 'Ideal', data: projectBurndownIdeal },
]

const startPoints = projectBurndownActual[0] ?? 0
const leftPoints = projectBurndownActual.at(-1) ?? 0
const idealNow = projectBurndownIdeal[projectBurndownActual.length - 1] ?? 0
const completion = startPoints ? ((startPoints - leftPoints) / startPoints) * 100 : 0
/** Positive means ahead of the ideal line. */
const pointsAhead = idealNow - leftPoints

const totalItems = projectBoard.reduce((a, c) => a + c.count, 0)
const doneItems = projectBoard.find(c => c.name === 'Done')?.count ?? 0

const workloadPeak = Math.max(...projectWorkload.map(w => w.capacity), ...projectWorkload.map(w => w.assigned))

const milestoneTone: Record<Milestone['status'], { badge: 'positive' | 'brand' | 'neutral' | 'critical', icon: string, label: string }> = {
  shipped: { badge: 'positive', icon: 'lucide:circle-check', label: 'Shipped' },
  active: { badge: 'brand', icon: 'lucide:circle-dot', label: 'In flight' },
  slipping: { badge: 'critical', icon: 'lucide:circle-alert', label: 'Slipping' },
  upcoming: { badge: 'neutral', icon: 'lucide:circle-dashed', label: 'Upcoming' },
}

const impactTone: Record<RiskItem['impact'], { badge: 'critical' | 'caution' | 'neutral', icon: string }> = {
  high: { badge: 'critical', icon: 'lucide:circle-alert' },
  medium: { badge: 'caution', icon: 'lucide:triangle-alert' },
  low: { badge: 'neutral', icon: 'lucide:info' },
}

const risksByImpact = ['high', 'medium', 'low'] as const
const sortedRisks = computed(() =>
  [...projectRisks].sort((a, b) => risksByImpact.indexOf(a.impact) - risksByImpact.indexOf(b.impact)))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Delivery</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Sprint 24 · {{ SPRINT_DAYS }}-day cadence · {{ totalItems }} work items tracked.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:kanban" class="size-4" />
          </template>
          Open board
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:circle-plus" class="size-4" />
          </template>
          New item
        </GorgButton>
      </div>
    </header>

    <!-- board summary -->
    <div ref="board" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <GorgCard v-for="column in projectBoard" :key="column.name" interactive>
        <div class="flex items-center gap-2">
          <Icon :name="column.icon" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <p class="truncate text-xs font-medium text-[var(--text-muted)]">{{ column.name }}</p>
        </div>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-strong)]">{{ column.count }}</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Icon name="lucide:plus" class="size-3" aria-hidden="true" />
          {{ column.added }} added this week
        </p>
        <div class="mt-3 h-1.5 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
          <div
            class="h-full rounded-pill bg-tide-500"
            :style="{ width: `${(column.count / totalItems) * 100}%` }"
          />
        </div>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Burndown"
          subtitle="Story points remaining against the ideal line"
          :series="burndown"
          :labels="projectSprintLabels"
          :height="300"
        >
          <GorgLineChart
            :series="burndown"
            :labels="projectSprintLabels"
            :height="300"
            :smooth="false"
            :format="n => String(Math.round(n))"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <template #title>
          Sprint health
        </template>
        <template #subtitle>
          Day {{ projectBurndownActual.length }} of {{ SPRINT_DAYS }}
        </template>

        <div class="grid place-items-center">
          <GorgGauge
            :value="completion"
            label="Points burned"
            :status="pointsAhead >= 0 ? 'good' : 'warning'"
            :format="n => `${Math.round(n)}%`"
          />
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-field bg-[var(--surface-sunken)] p-3">
            <dt class="text-xs text-[var(--text-muted)]">Remaining</dt>
            <dd class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
              {{ leftPoints }} pts
            </dd>
          </div>
          <div class="rounded-field bg-[var(--surface-sunken)] p-3">
            <dt class="text-xs text-[var(--text-muted)]">Versus ideal</dt>
            <dd
              class="mt-1 inline-flex items-center gap-1 text-lg font-semibold tabular-nums"
              :class="pointsAhead >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="pointsAhead >= 0 ? 'lucide:trending-down' : 'lucide:trending-up'"
                class="size-4"
                aria-hidden="true"
              />
              {{ pointsAhead >= 0 ? '+' : '' }}{{ pointsAhead }} pts
            </dd>
          </div>
        </dl>

        <p class="mt-3 text-xs text-[var(--text-muted)]">
          {{ doneItems }} items closed this sprint. Burn is
          {{ pointsAhead >= 0 ? 'ahead of' : 'behind' }} the ideal line.
        </p>
      </GorgCard>
    </div>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <!-- workload -->
      <GorgCard>
        <template #title>
          Team workload
        </template>
        <template #subtitle>
          Assigned points against weekly capacity
        </template>

        <ul class="space-y-3.5">
          <li v-for="person in projectWorkload" :key="person.name" class="min-w-0">
            <div class="flex items-center gap-2.5">
              <GorgAvatar :name="person.name" size="xs" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ person.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ person.role }}</p>
              </div>
              <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                {{ person.assigned }} / {{ person.capacity }}
              </span>
            </div>

            <div class="relative mt-1.5 h-2 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill"
                :class="person.assigned > person.capacity ? 'bg-[var(--color-caution)]' : 'bg-tide-500'"
                :style="{ width: `${(person.assigned / workloadPeak) * 100}%` }"
              />
              <!-- capacity marker, so over-allocation is visible not inferred -->
              <span
                class="absolute inset-y-0 w-px bg-[var(--text-muted)]"
                :style="{ left: `${(person.capacity / workloadPeak) * 100}%` }"
                aria-hidden="true"
              />
            </div>

            <p
              v-if="person.assigned > person.capacity"
              class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-caution)]"
            >
              <Icon name="lucide:triangle-alert" class="size-3.5" aria-hidden="true" />
              Over capacity by {{ person.assigned - person.capacity }} pts
            </p>
          </li>
        </ul>
      </GorgCard>

      <!-- milestones -->
      <GorgCard>
        <template #title>
          Milestones
        </template>
        <template #subtitle>
          Path to general availability
        </template>

        <ol class="relative space-y-5">
          <span
            class="absolute start-[11px] top-2 bottom-2 w-px bg-[var(--surface-border)]"
            aria-hidden="true"
          />

          <li v-for="milestone in projectMilestones" :key="milestone.name" class="relative flex gap-3">
            <span
              class="relative z-10 grid size-6 shrink-0 place-items-center rounded-pill bg-[var(--surface-raised)] ring-1 ring-[var(--surface-border)]"
            >
              <Icon
                :name="milestoneTone[milestone.status].icon"
                class="size-3.5"
                :class="{
                  'text-[var(--color-positive)]': milestone.status === 'shipped',
                  'text-tide-600 dark:text-tide-300': milestone.status === 'active',
                  'text-[var(--color-critical)]': milestone.status === 'slipping',
                  'text-[var(--text-muted)]': milestone.status === 'upcoming',
                }"
                aria-hidden="true"
              />
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p class="min-w-0 truncate text-sm font-medium text-[var(--text-strong)]">
                  {{ milestone.name }}
                </p>
                <GorgBadge :tone="milestoneTone[milestone.status].badge" size="xs">
                  {{ milestoneTone[milestone.status].label }}
                </GorgBadge>
              </div>
              <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">{{ milestone.detail }}</p>
              <p class="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Icon name="lucide:calendar" class="size-3.5" aria-hidden="true" />
                {{ milestone.date }}
                <span class="tabular-nums">· {{ milestone.progress }}%</span>
              </p>
              <GorgProgress
                v-if="milestone.status !== 'upcoming'"
                class="mt-1.5"
                :value="milestone.progress"
                size="xs"
                :tone="milestone.status === 'slipping' ? 'critical' : milestone.status === 'shipped' ? 'positive' : 'brand'"
              />
            </div>
          </li>
        </ol>
      </GorgCard>

      <GorgWidgetActivity title="Activity" :entries="projectActivity" />
    </div>

    <!-- at risk -->
    <GorgCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">At-risk items</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ sortedRisks.length }} open, highest impact first.
          </p>
        </div>
        <GorgButton variant="outline" size="xs">
          <template #lead>
            <Icon name="lucide:shield-alert" class="size-3.5" />
          </template>
          Review all
        </GorgButton>
      </div>

      <div class="p-4">
        <GorgFlexTable label="At-risk items">
          <GorgFlexTableRow header>
            <GorgFlexTableHeading width="7rem" fixed>
              Impact
            </GorgFlexTableHeading>
            <GorgFlexTableHeading width="18rem">
              Item
            </GorgFlexTableHeading>
            <GorgFlexTableHeading>Note</GorgFlexTableHeading>
            <GorgFlexTableHeading width="12rem">
              Owner
            </GorgFlexTableHeading>
            <GorgFlexTableHeading align="end" width="6rem">
              Due
            </GorgFlexTableHeading>
          </GorgFlexTableRow>

          <GorgFlexTableRow v-for="risk in sortedRisks" :key="risk.id">
            <GorgFlexTableCell width="7rem" fixed label="Impact">
              <GorgBadge :tone="impactTone[risk.impact].badge" size="xs">
                <Icon :name="impactTone[risk.impact].icon" class="size-3" aria-hidden="true" />
                {{ risk.impact }}
              </GorgBadge>
            </GorgFlexTableCell>

            <GorgFlexTableCell width="18rem" label="Item">
              <span class="min-w-0">
                <span class="block truncate font-medium text-[var(--text-strong)]">{{ risk.title }}</span>
                <span class="block truncate font-mono text-xs text-[var(--text-muted)]">{{ risk.id }}</span>
              </span>
            </GorgFlexTableCell>

            <GorgFlexTableCell label="Note">
              <span class="text-[var(--text-muted)]">{{ risk.note }}</span>
            </GorgFlexTableCell>

            <GorgFlexTableCell width="12rem" label="Owner">
              <span class="inline-flex items-center gap-2">
                <GorgAvatar :name="risk.owner" size="xs" />
                <span class="truncate">{{ risk.owner }}</span>
              </span>
            </GorgFlexTableCell>

            <GorgFlexTableCell align="end" width="6rem" label="Due">
              <span class="tabular-nums text-[var(--text-muted)]">{{ risk.due }}</span>
            </GorgFlexTableCell>
          </GorgFlexTableRow>
        </GorgFlexTable>
      </div>
    </GorgCard>
  </div>
</template>
