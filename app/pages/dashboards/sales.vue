<script setup lang="ts">
import type { DealStage } from '~/utils/mock'
import { formatCompact, formatCurrency, slotColor } from '~/utils/chart'
import {
  MONTHS,
  salesBooked,
  salesDeals,
  salesPipeline,
  salesRecentCloses,
  salesReps,
  salesTarget,
} from '~/utils/mock'

useHead({ title: 'Sales' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const board = useTemplateRef<HTMLElement>('board')
useStagger(board, { each: 0.07 })

const money = (n: number) => `$${formatCompact(n)}`
const exact = (n: number) => formatCurrency(n, 0)

/* -- pipeline -------------------------------------------------------------
   One measure (open value) across five ordered stages, so every bar keeps
   the same chart slot — the stage is the category, not the series. */
const funnelPeak = Math.max(...salesPipeline.map(s => s.value))
const funnel = salesPipeline.map((stage, i) => {
  const previous = salesPipeline[i - 1]
  return {
    ...stage,
    width: (stage.value / funnelPeak) * 100,
    carry: previous ? stage.deals / previous.deals : null,
  }
})

const pipelineSeries = [{ name: 'Open value', data: salesPipeline.map(s => s.value) }]
const pipelineLabels = salesPipeline.map(s => s.name)

const pipelineValue = salesPipeline
  .filter(s => s.name !== 'Closed won')
  .reduce((a, s) => a + s.value, 0)

/* -- revenue vs target ----------------------------------------------------
   Both series are booked dollars, so they share one axis truthfully. */
const revenueSeries = [
  { name: 'Booked', data: salesBooked },
  { name: 'Target', data: salesTarget },
]

const bookedYtd = salesBooked.reduce((a, b) => a + b, 0)
const targetYtd = salesTarget.reduce((a, b) => a + b, 0)
const attainment = (bookedYtd / targetYtd) * 100

const weighted = salesDeals
  .filter(d => d.stage !== 'Closed won')
  .reduce((a, d) => a + d.value * d.probability, 0)

const wonDeals = salesDeals.filter(d => d.stage === 'Closed won')
const avgDeal = salesDeals.reduce((a, d) => a + d.value, 0) / salesDeals.length

/* Stage badges use brand/accent/neutral for position in the pipeline, and
   reserve the semantic roles for the two that describe real state. */
const stageTone: Record<DealStage, 'neutral' | 'brand' | 'accent' | 'positive' | 'critical'> = {
  'Discovery': 'neutral',
  'Proposal': 'brand',
  'Negotiation': 'accent',
  'Closed won': 'positive',
  'Stalled': 'critical',
}

const stageIcon: Partial<Record<DealStage, string>> = {
  'Closed won': 'lucide:circle-check',
  'Stalled': 'lucide:circle-pause',
}

const dealColumns = [
  { key: 'account', label: 'Account', width: '18rem', sortable: true },
  { key: 'owner', label: 'Owner', width: '13rem' },
  { key: 'stage', label: 'Stage' },
  { key: 'value', label: 'Value', align: 'end' as const, sortable: true },
  { key: 'probability', label: 'Win', align: 'end' as const },
  { key: 'closes', label: 'Closes', align: 'end' as const, nowrap: true },
]

const { sortKey, sortDirection, visible: sortedDeals, total: dealCount } = useCollection(salesDeals, {
  initialSort: 'value',
  initialDirection: 'desc',
  pageSize: 0,
})

const leaderboard = [...salesReps].sort((a, b) => b.closed - a.closed)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Sales</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Pipeline, attainment and close activity for the current fiscal year.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:filter" class="size-4" />
          </template>
          All regions
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:plus" class="size-4" />
          </template>
          New deal
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Open pipeline"
        :value="pipelineValue"
        :delta="0.094"
        icon="lucide:filter"
        :format="money"
      />
      <GorgStatTile
        label="Weighted forecast"
        :value="weighted"
        :delta="0.061"
        icon="lucide:target"
        :format="money"
      />
      <GorgStatTile
        label="Avg. deal size"
        :value="avgDeal"
        :delta="-0.027"
        icon="lucide:receipt"
        :format="money"
      />
      <GorgStatTile
        label="Won this quarter"
        :value="wonDeals.length"
        :delta="0.15"
        icon="lucide:handshake"
        :format="n => String(Math.round(n))"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-5">
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Pipeline by stage"
          subtitle="Open value and deal count"
          :series="pipelineSeries"
          :labels="pipelineLabels"
          :height="300"
        >
          <ol class="space-y-3">
            <li v-for="stage in funnel" :key="stage.name">
              <div class="flex items-baseline justify-between gap-2 text-sm">
                <span class="truncate font-medium text-[var(--text-strong)]">{{ stage.name }}</span>
                <span class="shrink-0 tabular-nums text-[var(--text-strong)]">{{ money(stage.value) }}</span>
              </div>

              <div class="mt-1.5 h-6 overflow-hidden rounded-field bg-[var(--surface-sunken)]">
                <div
                  class="h-full rounded-field transition-[width] duration-(--duration-slow)"
                  :style="{ width: `${stage.width}%`, background: slotColor(0) }"
                />
              </div>

              <p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--text-muted)]">
                <span class="tabular-nums">{{ stage.deals }} deals</span>
                <span v-if="stage.carry !== null" class="inline-flex items-center gap-1">
                  <Icon name="lucide:corner-down-right" class="size-3.5" aria-hidden="true" />
                  {{ (stage.carry * 100).toFixed(0) }}% carried forward
                </span>
              </p>
            </li>
          </ol>
        </GorgChartFrame>
      </GorgCard>

      <GorgCard class="lg:col-span-3">
        <GorgChartFrame
          title="Booked against target"
          subtitle="Monthly, same unit on one axis"
          :series="revenueSeries"
          :labels="MONTHS"
          :height="300"
        >
          <GorgLineChart
            :series="revenueSeries"
            :labels="MONTHS"
            :height="300"
            :format="money"
          />
        </GorgChartFrame>

        <template #footer>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs text-[var(--text-muted)]">Year-to-date attainment</p>
              <p class="text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ attainment.toFixed(1) }}%
              </p>
            </div>
            <p class="text-xs tabular-nums text-[var(--text-muted)]">
              {{ exact(bookedYtd) }} booked · {{ exact(targetYtd) }} target
            </p>
          </div>
        </template>
      </GorgCard>
    </div>

    <div ref="board" class="grid gap-4 lg:grid-cols-3">
      <GorgCard :padded="false" class="lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Open and recent deals</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ dealCount }} records</p>
          </div>
          <GorgButton variant="ghost" size="xs">
            <template #lead>
              <Icon name="lucide:download" class="size-3.5" />
            </template>
            Export
          </GorgButton>
        </div>

        <GorgTable
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          :columns="dealColumns"
          :rows="sortedDeals"
          row-key="id"
          hoverable
          striped
        >
          <template #cell-account="{ row }">
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-strong)]">{{ row.account }}</p>
              <p class="truncate font-mono text-xs text-[var(--text-muted)]">{{ row.id }}</p>
            </div>
          </template>

          <template #cell-owner="{ value }">
            <div class="flex min-w-0 items-center gap-2">
              <GorgAvatar :name="value as string" size="xs" />
              <span class="truncate text-sm">{{ value }}</span>
            </div>
          </template>

          <template #cell-stage="{ value }">
            <GorgBadge :tone="stageTone[value as DealStage]" size="xs">
              <Icon
                v-if="stageIcon[value as DealStage]"
                :name="stageIcon[value as DealStage]!"
                class="size-3"
                aria-hidden="true"
              />
              {{ value }}
            </GorgBadge>
          </template>

          <template #cell-value="{ value }">
            <span class="font-medium tabular-nums">{{ exact(value as number) }}</span>
          </template>

          <template #cell-probability="{ value }">
            <span class="tabular-nums text-[var(--text-muted)]">
              {{ Math.round((value as number) * 100) }}%
            </span>
          </template>

          <template #cell-closes="{ value }">
            <span class="tabular-nums text-[var(--text-muted)]">{{ value }}</span>
          </template>
        </GorgTable>
      </GorgCard>

      <GorgCard>
        <template #title>
          Rep leaderboard
        </template>
        <template #subtitle>
          Closed against quota, fiscal year
        </template>

        <ol class="space-y-4">
          <li v-for="(rep, i) in leaderboard" :key="rep.name" class="min-w-0">
            <div class="flex items-center gap-3">
              <span
                class="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-[var(--text-muted)]"
              >{{ i + 1 }}</span>
              <GorgAvatar :name="rep.name" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ rep.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">
                  {{ rep.region }} · {{ rep.deals }} deals
                </p>
              </div>
              <span class="shrink-0 text-sm font-medium tabular-nums text-[var(--text-strong)]">
                {{ money(rep.closed) }}
              </span>
            </div>

            <div class="mt-2 ps-7">
              <GorgProgress
                :value="Math.min(100, (rep.closed / rep.quota) * 100)"
                size="xs"
                :tone="rep.closed >= rep.quota ? 'positive' : 'brand'"
              />
              <p class="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Icon
                  :name="rep.closed >= rep.quota ? 'lucide:circle-check' : 'lucide:flag'"
                  class="size-3.5"
                  aria-hidden="true"
                />
                {{ ((rep.closed / rep.quota) * 100).toFixed(0) }}% of {{ money(rep.quota) }} quota
              </p>
            </div>
          </li>
        </ol>
      </GorgCard>
    </div>

    <GorgCard>
      <template #title>
        Recent closes
      </template>
      <template #subtitle>
        Signed in the last fourteen days
      </template>

      <GorgFlexTable label="Recent closes" compact>
        <GorgFlexTableRow header>
          <GorgFlexTableHeading width="16rem">
            Account
          </GorgFlexTableHeading>
          <GorgFlexTableHeading width="12rem">
            Owner
          </GorgFlexTableHeading>
          <GorgFlexTableHeading>Plan</GorgFlexTableHeading>
          <GorgFlexTableHeading align="end" width="8rem">
            Value
          </GorgFlexTableHeading>
          <GorgFlexTableHeading align="end" width="7rem">
            Signed
          </GorgFlexTableHeading>
        </GorgFlexTableRow>

        <GorgFlexTableRow v-for="close in salesRecentCloses" :key="close.id">
          <GorgFlexTableCell width="16rem" label="Account">
            <span class="font-medium text-[var(--text-strong)]">{{ close.account }}</span>
          </GorgFlexTableCell>
          <GorgFlexTableCell width="12rem" label="Owner">
            <span class="inline-flex items-center gap-2">
              <GorgAvatar :name="close.owner" size="xs" />
              <span class="truncate">{{ close.owner }}</span>
            </span>
          </GorgFlexTableCell>
          <GorgFlexTableCell label="Plan">
            <span class="text-[var(--text-muted)]">{{ close.plan }}</span>
          </GorgFlexTableCell>
          <GorgFlexTableCell align="end" width="8rem" label="Value">
            <span class="font-medium tabular-nums">{{ exact(close.value) }}</span>
          </GorgFlexTableCell>
          <GorgFlexTableCell align="end" width="7rem" label="Signed">
            <span class="tabular-nums text-[var(--text-muted)]">{{ close.at }}</span>
          </GorgFlexTableCell>
        </GorgFlexTableRow>
      </GorgFlexTable>
    </GorgCard>
  </div>
</template>
