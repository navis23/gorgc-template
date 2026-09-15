<script setup lang="ts">
import type { ExecFeedKind, ExecGoalStatus } from '~/utils/mock-ops'
import { formatCompact, formatCurrency, groupInt } from '~/utils/chart'
import {
  execBurnMonthly,
  execDepartments,
  execFeed,
  execGoals,
  execMonthLabels,
  execPulse,
  execRevenueMonthly,
  execSpendByDepartment,
} from '~/utils/mock-ops'

useHead({ title: 'Company' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const budgets = useTemplateRef<HTMLElement>('budgets')
useStagger(budgets, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.08 })

const money = (n: number) => `$${formatCompact(n)}`
const exact = (n: number) => formatCurrency(n, 0)
/* The counter walks through integers, so months ride in tenths. */
const months = (n: number) => `${(n / 10).toFixed(1)} mo`

/* Revenue and burn get a plot each. They are both dollars, but they are not the
   same measure and a shared axis would let the taller one set the story — so
   they sit side by side on independent scales instead of on two y-axes. */
const revenueSeriesExec = [{ name: 'Revenue', data: execRevenueMonthly }]
const burnSeriesExec = [{ name: 'Operating burn', data: execBurnMonthly }]

const revenueYear = execRevenueMonthly.reduce((a, b) => a + b, 0)
const burnYear = execBurnMonthly.reduce((a, b) => a + b, 0)

/* ---------------------------------------------------------------- budgets */

const spendTotal = execSpendByDepartment.reduce((a, d) => a + d.value, 0)
const allocatedTotal = execDepartments.reduce((a, d) => a + d.allocated, 0)
const spendSeries = execSpendByDepartment.map(d => ({ name: d.name, data: [d.value] }))

/** Past this share of the quarter's budget, the spend needs a conversation. */
const TIGHT = 0.9

function budgetState(used: number, allocated: number) {
  const share = used / allocated
  if (share > 1)
    return { tone: 'critical' as const, label: 'Over budget', icon: 'lucide:circle-alert' }
  if (share >= TIGHT)
    return { tone: 'caution' as const, label: 'Nearly spent', icon: 'lucide:triangle-alert' }
  return { tone: 'brand' as const, label: 'On plan', icon: 'lucide:circle-check' }
}

const overspending = execDepartments.filter(d => d.used > d.allocated).length

const topSpend = [...execSpendByDepartment].sort((a, b) => b.value - a.value)[0]!

/* ------------------------------------------------------------------ goals */

const goalMeta: Record<ExecGoalStatus, {
  label: string
  tone: 'positive' | 'caution' | 'critical' | 'brand'
  icon: string
  bar: 'positive' | 'caution' | 'critical' | 'brand'
}> = {
  'on-track': { label: 'On track', tone: 'brand', icon: 'lucide:circle-dot', bar: 'brand' },
  'at-risk': { label: 'At risk', tone: 'caution', icon: 'lucide:triangle-alert', bar: 'caution' },
  'off-track': { label: 'Off track', tone: 'critical', icon: 'lucide:circle-alert', bar: 'critical' },
  'done': { label: 'Landed', tone: 'positive', icon: 'lucide:circle-check', bar: 'positive' },
}

const goalsLanded = execGoals.filter(g => g.status === 'done').length
const goalsSlipping = execGoals.filter(g => g.status === 'at-risk' || g.status === 'off-track').length

/* ------------------------------------------------------------------- feed */

const feedMeta: Record<ExecFeedKind, {
  tone: 'brand' | 'info' | 'caution' | 'positive'
  icon: string
}> = {
  decision: { tone: 'brand', icon: 'lucide:gavel' },
  announcement: { tone: 'info', icon: 'lucide:megaphone' },
  risk: { tone: 'caution', icon: 'lucide:triangle-alert' },
  milestone: { tone: 'positive', icon: 'lucide:flag' },
}

const feedItems = execFeed.map(item => ({
  id: item.id,
  title: item.title,
  description: item.detail,
  icon: feedMeta[item.kind].icon,
  tone: feedMeta[item.kind].tone,
  at: item.day,
  meta: `${item.actor} · ${item.forum}`,
}))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Company overview</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Trading, cash and commitments for the twelve months to {{ execMonthLabels.at(-1) }}.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:file-text" class="size-4" />
          </template>
          Board pack
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:send" class="size-4" />
          </template>
          Share update
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Revenue, this month"
        :value="execPulse.revenue"
        :delta="execPulse.revenueDelta"
        icon="lucide:banknote"
        :format="money"
        :sparkline="execRevenueMonthly"
      />
      <GorgStatTile
        label="Operating burn"
        :value="execPulse.burn"
        :delta="execPulse.burnDelta"
        invert
        icon="lucide:flame"
        :format="money"
        :sparkline="execBurnMonthly"
      />
      <GorgStatTile
        label="Runway"
        :value="execPulse.runway * 10"
        :delta="execPulse.runwayDelta"
        icon="lucide:battery-medium"
        :format="months"
      />
      <GorgStatTile
        label="Headcount"
        :value="execPulse.headcount"
        :delta="execPulse.headcountDelta"
        icon="lucide:users"
        :format="n => groupInt(n)"
      />
    </div>

    <GorgCard>
      <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="min-w-0">
          <dt class="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">Cash on hand</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
            {{ exact(execPulse.cash) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">Net burn, monthly</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
            {{ exact(execPulse.netBurn) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">Gross margin</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
            {{ (execPulse.grossMargin * 100).toFixed(1) }}%
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">Revenue, trailing year</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
            {{ money(revenueYear) }}
          </dd>
        </div>
      </dl>
    </GorgCard>

    <!-- Two measures, two plots. Never one chart with two axes. -->
    <div class="grid gap-4 lg:grid-cols-2">
      <GorgCard>
        <GorgChartFrame
          title="Revenue"
          :subtitle="`${money(revenueYear)} booked over twelve months`"
          :series="revenueSeriesExec"
          :labels="execMonthLabels"
          :height="280"
        >
          <GorgLineChart
            :series="revenueSeriesExec"
            :labels="execMonthLabels"
            :height="280"
            area
            :format="money"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame
          title="Operating burn"
          :subtitle="`${money(burnYear)} spent over the same twelve months`"
          :series="burnSeriesExec"
          :labels="execMonthLabels"
          :height="280"
        >
          <GorgBarChart
            :series="burnSeriesExec"
            :labels="execMonthLabels"
            :height="280"
            :format="money"
          />
        </GorgChartFrame>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <!-- spend mix -->
      <GorgCard>
        <GorgChartFrame
          title="Spend by department"
          :subtitle="`${money(spendTotal)} of ${money(allocatedTotal)} allocated this quarter`"
          :series="spendSeries"
          :labels="['Quarter to date']"
          :height="260"
        >
          <div class="grid place-items-center pt-1">
            <GorgDonutChart
              :data="execSpendByDepartment"
              :size="196"
              center-label="Spent"
              :format="n => money(n)"
            />
          </div>
        </GorgChartFrame>

        <template #footer>
          <p class="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>Largest cost centre</span>
            <span class="font-medium text-[var(--text-strong)]">
              {{ topSpend.name }} · {{ money(topSpend.value) }}
              <span class="font-normal text-[var(--text-muted)]">
                ({{ ((topSpend.value / spendTotal) * 100).toFixed(0) }}% of spend)
              </span>
            </span>
          </p>
        </template>
      </GorgCard>

      <!-- budget by department -->
      <div class="lg:col-span-2">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Budget used against allocation</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Quarter to date, all cost centres.</p>
          </div>
          <GorgBadge :tone="overspending ? 'critical' : 'positive'" size="xs">
            <Icon
              :name="overspending ? 'lucide:circle-alert' : 'lucide:circle-check'"
              class="size-3"
              aria-hidden="true"
            />
            {{ overspending ? `${overspending} over budget` : 'All within budget' }}
          </GorgBadge>
        </div>

        <div ref="budgets" class="grid gap-3 sm:grid-cols-2">
          <GorgCard v-for="department in execDepartments" :key="department.name" interactive>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ department.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">
                  {{ department.lead }} · {{ department.headcount }} people
                </p>
              </div>
              <span
                class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <Icon :name="department.icon" class="size-4" aria-hidden="true" />
              </span>
            </div>

            <p class="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span class="text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ money(department.used) }}
              </span>
              <span class="text-xs tabular-nums text-[var(--text-muted)]">
                of {{ money(department.allocated) }}
              </span>
            </p>

            <GorgProgress
              class="mt-2"
              :value="Math.min(department.used, department.allocated)"
              :max="department.allocated"
              :tone="budgetState(department.used, department.allocated).tone"
              size="sm"
              aria-hidden="true"
            />

            <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
              <GorgBadge :tone="budgetState(department.used, department.allocated).tone" size="xs">
                <Icon
                  :name="budgetState(department.used, department.allocated).icon"
                  class="size-3"
                  aria-hidden="true"
                />
                {{ budgetState(department.used, department.allocated).label }}
              </GorgBadge>
              <span class="text-xs tabular-nums text-[var(--text-muted)]">
                {{ ((department.used / department.allocated) * 100).toFixed(0) }}% · {{ department.focus }}
              </span>
            </div>
          </GorgCard>
        </div>
      </div>
    </div>

    <div ref="lower" class="grid gap-4 lg:grid-cols-2">
      <!-- objectives -->
      <GorgCard>
        <template #title>
          Objectives this quarter
        </template>
        <template #subtitle>
          {{ goalsLanded }} landed · {{ goalsSlipping }} need attention
        </template>

        <ol class="space-y-5">
          <li v-for="goal in execGoals" :key="goal.id" class="min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ goal.objective }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{{ goal.keyResult }}</p>
              </div>
              <GorgBadge :tone="goalMeta[goal.status].tone" size="xs" class="shrink-0">
                <Icon :name="goalMeta[goal.status].icon" class="size-3" aria-hidden="true" />
                {{ goalMeta[goal.status].label }}
              </GorgBadge>
            </div>

            <!-- the tick marks where the quarter says we should be by now -->
            <div class="relative mt-2 h-2 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
              <div
                class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
                :class="{
                  'bg-tide-500': goalMeta[goal.status].bar === 'brand',
                  'bg-[var(--color-positive)]': goalMeta[goal.status].bar === 'positive',
                  'bg-[var(--color-caution)]': goalMeta[goal.status].bar === 'caution',
                  'bg-[var(--color-critical)]': goalMeta[goal.status].bar === 'critical',
                }"
                :style="{ width: `${goal.progress * 100}%` }"
              />
              <span
                class="absolute inset-y-0 w-0.5 bg-[var(--text-strong)] opacity-60"
                :style="{ left: `${goal.pace * 100}%` }"
                aria-hidden="true"
              />
            </div>

            <div class="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span class="inline-flex items-center gap-1.5">
                <GorgAvatar :name="goal.owner" size="xs" />
                {{ goal.owner }} · {{ goal.team }}
              </span>
              <span class="tabular-nums">
                {{ (goal.progress * 100).toFixed(0) }}% done, {{ (goal.pace * 100).toFixed(0) }}% expected
              </span>
            </div>
          </li>
        </ol>

        <template #footer>
          <p class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span class="inline-block h-3 w-0.5 bg-[var(--text-strong)] opacity-60" aria-hidden="true" />
            Marker shows where the quarter expects each objective to be today.
          </p>
        </template>
      </GorgCard>

      <!-- decisions -->
      <GorgCard>
        <template #title>
          Decisions and announcements
        </template>
        <template #subtitle>
          What the exec team settled, most recent first
        </template>
        <template #header>
          <GorgButton variant="ghost" size="xs">
            <template #lead>
              <Icon name="lucide:history" class="size-3.5" />
            </template>
            Full log
          </GorgButton>
        </template>

        <GorgTimeline :items="feedItems" size="md" />
      </GorgCard>
    </div>
  </div>
</template>
