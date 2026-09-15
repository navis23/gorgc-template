<script setup lang="ts">
import { channelSplit, MONTHS, revenueSeries, trafficSeries, WEEKDAYS, walk } from '~/utils/mock'
import { formatCompact } from '~/utils/chart'

useHead({ title: 'Charts' })

const money = (n: number) => `$${formatCompact(n)}`

// A single series needs no legend — the title names it.
const singleSeries = [{ name: 'Sessions', data: walk(12, 5200, 0.02, 0.12).map(Math.round) }]

const stackedSeries = trafficSeries
const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.06 })
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Charts</h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Every form in the set, on the validated palette. Toggle the table icon on any
        chart to read it as data.
      </p>
    </header>

    <div ref="grid" class="grid gap-4 lg:grid-cols-2">
      <GorgCard>
        <GorgChartFrame title="Area — multi-series" subtitle="Revenue by line, monthly"
          :series="revenueSeries" :labels="MONTHS" :height="260">
          <GorgLineChart :series="revenueSeries" :labels="MONTHS" area :height="260" :format="money" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame title="Line — single series" subtitle="Sessions, monthly"
          :series="singleSeries" :labels="MONTHS" :height="260">
          <GorgLineChart :series="singleSeries" :labels="MONTHS" :height="260" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame title="Bar — grouped" subtitle="Traffic by source and weekday"
          :series="stackedSeries" :labels="WEEKDAYS" :height="260">
          <GorgBarChart :series="stackedSeries" :labels="WEEKDAYS" :height="260" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame title="Bar — stacked" subtitle="Same data, cumulative"
          :series="stackedSeries" :labels="WEEKDAYS" :height="260">
          <GorgBarChart :series="stackedSeries" :labels="WEEKDAYS" stacked :height="260" />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame title="Donut" subtitle="Acquisition channels"
          :series="channelSplit.map(c => ({ name: c.name, data: [c.value] }))"
          :labels="['Sessions']" :height="260">
          <div class="grid place-items-center pt-2">
            <GorgDonutChart :data="channelSplit" :size="200" />
          </div>
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <template #title>Gauges</template>
        <template #subtitle>Status tones are reserved for real state</template>
        <div class="grid grid-cols-2 place-items-center gap-4 pt-2">
          <GorgGauge :value="87" label="Uptime" status="good" :size="140" />
          <GorgGauge :value="41" label="Storage" :size="140" />
        </div>
      </GorgCard>

      <GorgCard class="lg:col-span-2">
        <template #title>Sparklines</template>
        <template #subtitle>Direction is carried by icon and sign, never colour alone</template>
        <div class="grid gap-4 pt-2 sm:grid-cols-3">
          <div v-for="s in revenueSeries" :key="s.name" class="min-w-0">
            <p class="truncate text-xs font-medium text-[var(--text-muted)]">{{ s.name }}</p>
            <p class="mt-1 text-lg font-semibold tabular-nums text-[var(--text-strong)]">
              {{ money(s.data.reduce((a, b) => a + b, 0)) }}
            </p>
            <GorgSparkline :data="s.data" tone class="mt-2" :height="44" />
          </div>
        </div>
      </GorgCard>
    </div>
  </div>
</template>
