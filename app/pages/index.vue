<script setup lang="ts">
import { activity, channelSplit, MONTHS, revenueSeries, trafficSeries, WEEKDAYS } from '~/utils/mock'
import { formatCompact } from '~/utils/chart'

useHead({ title: 'Overview' })

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.05 })

const money = (n: number) => `$${formatCompact(n)}`

/**
 * Derive a tile's delta from the series it displays.
 *
 * These were hardcoded, so a seeded walk that happened to end down rendered a
 * red sparkline beside a green delta — the tile contradicting itself. Deriving
 * makes that impossible.
 */
function trend(series: number[]) {
  const first = series[0] ?? 0
  const last = series.at(-1) ?? 0
  return first ? (last - first) / first : 0
}

const totalRevenue = computed(() =>
  revenueSeries.reduce((a, s) => a + s.data.reduce((x, y) => x + y, 0), 0))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Overview</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Rolling 12-month performance across all revenue lines.
        </p>
      </div>
      <div class="flex gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:calendar" class="size-4" />
          </template>
          Last 12 months
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:download" class="size-4" />
          </template>
          Export
        </GorgButton>
      </div>
    </header>

    <div ref="grid" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Total revenue" :value="totalRevenue" :delta="trend(revenueSeries[0]!.data)"
        icon="lucide:banknote" :format="money" :sparkline="revenueSeries[0]!.data"
      />
      <GorgStatTile
        label="Active accounts" :value="8412" :delta="trend(trafficSeries[1]!.data)"
        icon="lucide:users" :sparkline="trafficSeries[1]!.data"
      />
      <GorgStatTile
        label="Churn rate" :value="2.4" :delta="-0.006" invert
        icon="lucide:user-minus" :format="n => `${n.toFixed(1)}%`"
      />
      <GorgStatTile
        label="Avg. response" :value="184" :delta="-0.092" invert
        icon="lucide:timer" :format="n => `${Math.round(n)}ms`"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Revenue by line"
          subtitle="Monthly, gross of refunds"
          :series="revenueSeries"
          :labels="MONTHS"
          :height="300"
        >
          <GorgLineChart :series="revenueSeries" :labels="MONTHS" area :height="300" :format="money" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame
          title="Acquisition channels"
          subtitle="Sessions this month"
          :series="channelSplit.map(c => ({ name: c.name, data: [c.value] }))"
          :labels="['Sessions']"
          :height="300"
        >
          <div class="grid place-items-center pt-2">
            <GorgDonutChart :data="channelSplit" :size="200" center-label="Sessions" />
          </div>
        </GorgChartFrame>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Traffic by source"
          subtitle="Sessions per weekday"
          :series="trafficSeries"
          :labels="WEEKDAYS"
          :height="260"
        >
          <GorgBarChart :series="trafficSeries" :labels="WEEKDAYS" :height="260" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <template #title>
          Recent activity
        </template>
        <ul class="-mx-1 divide-y divide-[var(--surface-border)]">
          <li v-for="a in activity" :key="a.id" class="flex gap-3 px-1 py-3 first:pt-0 last:pb-0">
            <GorgAvatar :name="a.actor" size="sm" />
            <div class="min-w-0 flex-1">
              <!-- flex + gap, because Vue condenses whitespace between inline spans -->
              <p class="flex flex-wrap items-baseline gap-x-1 text-sm text-[var(--text-strong)]">
                <span class="font-medium">{{ a.actor }}</span>
                <span class="text-[var(--text-muted)]">{{ a.action }}</span>
                <span class="font-medium">{{ a.target }}</span>
              </p>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ a.at }}</p>
            </div>
          </li>
        </ul>
      </GorgCard>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <GorgCard>
        <div class="grid place-items-center">
          <GorgGauge :value="87" label="Uptime SLO" status="good" />
        </div>
      </GorgCard>
      <GorgCard>
        <div class="grid place-items-center">
          <GorgGauge :value="64" label="Storage used" />
        </div>
      </GorgCard>
      <GorgCard>
        <div class="grid place-items-center">
          <GorgGauge :value="93" label="Error budget burn" status="critical" />
        </div>
      </GorgCard>
    </div>
  </div>
</template>
