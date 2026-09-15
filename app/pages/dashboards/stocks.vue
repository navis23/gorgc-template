<script setup lang="ts">
import type { StockFill, StockSide } from '~/utils/mock-verticals'
import { formatCompact, formatCurrency, groupInt, slotColor } from '~/utils/chart'
import { dayTimeLabel, relativeLabel } from '~/utils/datetime'
import {
  STOCK_DAYS,
  stockAllocation,
  stockBuyingPower,
  stockCash,
  stockDayLabels,
  stockEquity,
  stockInstruments,
  stockInvested,
  stockOrders,
} from '~/utils/mock-verticals'

useHead({ title: 'Stocks' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.07 })

/* -- window ---------------------------------------------------------------
   One control, one window: the equity curve, the price plot, the volume plot
   and every return on the page are sliced from the same tail of history. */
const rangeKey = ref('90')
const range = computed(() => Number(rangeKey.value))
const rangeItems = [
  { value: '30', label: '1M' },
  { value: '90', label: '3M' },
  { value: '180', label: '6M' },
]

function tail<T>(arr: T[], n: number): T[] {
  return arr.slice(-n)
}

const labels = computed(() => tail(stockDayLabels, range.value))
const equityWindow = computed(() => tail(stockEquity, range.value))

/* -- portfolio ------------------------------------------------------------ */
const portfolioValue = stockEquity.at(-1) ?? 0
const prevValue = stockEquity.at(-2) ?? portfolioValue
const dayPnl = portfolioValue - prevValue
const dayPnlPct = prevValue ? dayPnl / prevValue : 0

const ret = (first: number, last: number) => (first ? (last - first) / first : 0)

const windowReturn = computed(() => ret(equityWindow.value[0] ?? 0, portfolioValue))
const windowPnl = computed(() => portfolioValue - (equityWindow.value[0] ?? 0))

/** Positions only — the cash leg would flatter the number. */
const investedAt = (index: number) =>
  stockInstruments.reduce((sum, i) => sum + i.shares * (i.history[index] ?? 0), 0)
const investedReturn = computed(() =>
  ret(investedAt(STOCK_DAYS - range.value), stockInvested))

const cashWeight = stockCash / (portfolioValue || 1)

/* -- selected instrument -------------------------------------------------- */
const selected = ref(stockInstruments[0]!.symbol)
const instrument = computed(() =>
  stockInstruments.find(i => i.symbol === selected.value) ?? stockInstruments[0]!)

const instrumentItems = stockInstruments.map(i => ({ label: `${i.symbol} · ${i.name}`, value: i.symbol }))

/* Price and volume are different measures on wildly different scales. They get
   two stacked plots over a shared x-axis — never one frame with two y-axes,
   which would invite the reader to see a correlation the data does not claim. */
const priceSeries = computed(() => [
  { name: `${instrument.value.symbol} close`, data: tail(instrument.value.history, range.value) },
])
const volumeSeries = computed(() => [
  { name: 'Shares traded', data: tail(instrument.value.volume, range.value) },
])

const instrumentReturn = computed(() => {
  const window = priceSeries.value[0]!.data
  return ret(window[0] ?? 0, window.at(-1) ?? 0)
})
const positionValue = computed(() => instrument.value.shares * instrument.value.last)

/* -- watchlist ------------------------------------------------------------ */
const watchRows = computed(() => stockInstruments.map(i => ({
  symbol: i.symbol,
  name: i.name,
  sector: i.sector,
  last: i.last,
  changePct: i.changePct,
  shares: i.shares,
  value: i.shares * i.last,
  spark: tail(i.history, 30),
})))

const { query, sortKey, sortDirection, sorted, total } = useCollection(watchRows, {
  searchFields: ['symbol', 'name', 'sector'],
  initialSort: 'value',
  initialDirection: 'desc',
  pageSize: 0,
})

const watchColumns = [
  { key: 'symbol', label: 'Ticker', width: '13rem', sortable: true },
  { key: 'last', label: 'Last', align: 'end' as const, sortable: true },
  { key: 'changePct', label: 'Day', align: 'end' as const, sortable: true, nowrap: true },
  { key: 'spark', label: '30-day', align: 'end' as const, width: '8rem' },
  { key: 'value', label: 'Position', align: 'end' as const, sortable: true, nowrap: true },
  { key: 'view', label: 'Chart', align: 'center' as const, width: '5rem' },
]

/* Sector slots are fixed by the allocation order, so a sector is the same
   colour in the donut, the weight list and the watchlist swatch. */
const sectorSlot = (name: string) =>
  slotColor(Math.max(0, stockAllocation.findIndex(a => a.name === name)))

/* -- orders --------------------------------------------------------------- */
const sideMeta: Record<StockSide, { label: string, icon: string }> = {
  buy: { label: 'Buy', icon: 'lucide:arrow-down-left' },
  sell: { label: 'Sell', icon: 'lucide:arrow-up-right' },
}

const fillMeta: Record<StockFill, {
  label: string
  icon: string
  tone: 'positive' | 'caution' | 'info' | 'neutral'
}> = {
  filled: { label: 'Filled', icon: 'lucide:circle-check', tone: 'positive' },
  partial: { label: 'Partly filled', icon: 'lucide:circle-dashed', tone: 'caution' },
  working: { label: 'Working', icon: 'lucide:clock', tone: 'info' },
  cancelled: { label: 'Cancelled', icon: 'lucide:circle-slash', tone: 'neutral' },
}

/* -- formatting ----------------------------------------------------------- */
const money = (n: number) => formatCurrency(n)
const money0 = (n: number) => formatCurrency(n, 0)
const signedMoney0 = (n: number) => `${n >= 0 ? '+' : ''}${formatCurrency(n, 0)}`
const signedPct = (n: number) => `${n >= 0 ? '+' : '−'}${(Math.abs(n) * 100).toFixed(2)}%`
const weightPct = (n: number) => `${(n * 100).toFixed(1)}%`
const shares = (n: number) => groupInt(n)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Portfolio</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ stockInstruments.length }} holdings, marked to the last close.
          Every return on this page is measured over the selected window.
        </p>
      </div>

      <GorgSegmented
        v-model="rangeKey"
        :items="rangeItems"
        variant="pill"
        aria-label="Return window"
        class="shrink-0"
      />
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Portfolio value"
        :value="portfolioValue"
        :delta="windowReturn"
        icon="lucide:wallet"
        :format="money0"
        :sparkline="equityWindow"
      />
      <GorgStatTile
        label="Day's P&L"
        :value="dayPnl"
        :delta="dayPnlPct"
        icon="lucide:activity"
        :format="signedMoney0"
      />
      <GorgStatTile
        label="Invested"
        :value="stockInvested"
        :delta="investedReturn"
        icon="lucide:chart-candlestick"
        :format="money0"
      />
      <GorgStatTile
        label="Buying power"
        :value="stockBuyingPower"
        icon="lucide:banknote"
        :format="money0"
      />
    </div>

    <!-- price + volume: one instrument, one window, two plots -->
    <GorgCard :padded="false">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 class="text-lg font-semibold text-[var(--text-strong)]">{{ instrument.symbol }}</h2>
            <p class="truncate text-sm text-[var(--text-muted)]">{{ instrument.name }}</p>
            <span
              class="inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-medium"
              :style="{ color: sectorSlot(instrument.sector) }"
            >
              <span class="size-2 rounded-[3px]" :style="{ background: sectorSlot(instrument.sector) }" aria-hidden="true" />
              {{ instrument.sector }}
            </span>
          </div>
          <div class="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p class="text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
              {{ money(instrument.last) }}
            </p>
            <p
              class="inline-flex items-center gap-1 text-sm font-medium tabular-nums"
              :class="instrument.changePct >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="instrument.changePct >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
                class="size-4"
                aria-hidden="true"
              />
              {{ signedPct(instrument.changePct) }}
              <span class="font-normal text-[var(--text-muted)]">on the day</span>
            </p>
            <p class="text-xs text-[var(--text-muted)]">
              {{ shares(instrument.shares) }} shares · {{ money(positionValue) }} held
            </p>
          </div>
        </div>

        <GorgSelect
          v-model="selected"
          :items="instrumentItems"
          size="sm"
          icon="lucide:search"
          class="w-full sm:w-64"
          aria-label="Instrument"
        />
      </div>

      <div class="space-y-5 p-4">
        <GorgChartFrame
          :title="`${instrument.symbol} closing price`"
          :subtitle="`Last ${range} days · ${signedPct(instrumentReturn)} over the window`"
          :series="priceSeries"
          :labels="labels"
          :height="300"
        >
          <GorgLineChart
            :series="priceSeries"
            :labels="labels"
            area
            :height="300"
            :show-markers="range <= 30"
            :format="money0"
          />
        </GorgChartFrame>

        <GorgChartFrame
          title="Volume"
          subtitle="Shares traded, same window"
          :series="volumeSeries"
          :labels="labels"
          :height="140"
        >
          <GorgBarChart
            :series="volumeSeries"
            :labels="labels"
            :height="140"
            :format="n => formatCompact(n)"
          />
        </GorgChartFrame>

        <p class="text-xs text-[var(--text-muted)]">
          Price and volume share the x-axis but keep separate plots. Stacking two
          unrelated scales on one pair of axes makes any crossing look like a signal.
        </p>
      </div>
    </GorgCard>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- watchlist -->
      <GorgCard :padded="false" class="min-w-0 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Watchlist</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ total }} of {{ stockInstruments.length }} instruments · pick one to chart it.
            </p>
          </div>
          <GorgInput
            v-model="query"
            placeholder="Ticker, name, sector…"
            icon="lucide:search"
            size="sm"
            clearable
            class="w-full sm:max-w-56"
            aria-label="Filter watchlist"
          />
        </div>

        <GorgTable
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          :columns="watchColumns"
          :rows="sorted"
          row-key="symbol"
          hoverable
        >
          <template #cell-symbol="{ row }">
            <div class="flex items-center gap-2.5">
              <span
                class="size-2.5 shrink-0 rounded-[3px]"
                :style="{ background: sectorSlot(row.sector) }"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="truncate font-mono text-sm font-semibold text-[var(--text-strong)]">{{ row.symbol }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ row.name }}</p>
              </div>
            </div>
          </template>

          <template #cell-last="{ value }">
            <span class="tabular-nums text-[var(--text-strong)]">{{ money(value as number) }}</span>
          </template>

          <!-- direction reads from the icon and the sign; colour only agrees -->
          <template #cell-changePct="{ value }">
            <span
              class="inline-flex items-center justify-end gap-1 text-xs font-medium tabular-nums"
              :class="(value as number) >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="(value as number) >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ signedPct(value as number) }}
            </span>
          </template>

          <template #cell-spark="{ row }">
            <div class="ms-auto w-24">
              <GorgSparkline :data="row.spark" :height="28" tone />
            </div>
          </template>

          <template #cell-value="{ row }">
            <div>
              <p class="tabular-nums text-[var(--text-strong)]">{{ money(row.value) }}</p>
              <p class="text-xs tabular-nums text-[var(--text-muted)]">{{ shares(row.shares) }} shares</p>
            </div>
          </template>

          <template #cell-view="{ row }">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-field px-2 py-1 text-xs font-medium transition-colors duration-(--duration-snap)"
              :class="row.symbol === selected
                ? 'bg-tide-600 text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
              :aria-pressed="row.symbol === selected"
              @click="selected = row.symbol"
            >
              <Icon
                :name="row.symbol === selected ? 'lucide:check' : 'lucide:chart-line'"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ row.symbol === selected ? 'Shown' : 'Show' }}
            </button>
          </template>
        </GorgTable>
      </GorgCard>

      <!-- allocation -->
      <GorgCard class="min-w-0">
        <GorgChartFrame
          title="Allocation by sector"
          subtitle="Share of invested capital"
          :series="stockAllocation.map(a => ({ name: a.name, data: [a.value] }))"
          :labels="['Value']"
          :height="230"
          :legend="false"
        >
          <div class="grid place-items-center pt-1">
            <GorgDonutChart
              :data="stockAllocation.map(a => ({ name: a.name, value: a.value }))"
              :size="190"
              center-label="Invested"
              :format="n => `$${formatCompact(n)}`"
            />
          </div>
        </GorgChartFrame>

        <ul class="mt-4 space-y-2">
          <li
            v-for="slice in stockAllocation"
            :key="slice.name"
            class="flex items-center gap-2.5 text-sm"
          >
            <span
              class="size-2.5 shrink-0 rounded-[3px]"
              :style="{ background: sectorSlot(slice.name) }"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate text-[var(--text-strong)]">{{ slice.name }}</span>
            <span class="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">{{ money0(slice.value) }}</span>
            <span class="w-12 shrink-0 text-end text-xs font-medium tabular-nums text-[var(--text-strong)]">
              {{ weightPct(slice.weight) }}
            </span>
          </li>
        </ul>

        <template #footer>
          <p class="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span class="inline-flex items-center gap-1.5">
              <Icon name="lucide:coins" class="size-3.5" aria-hidden="true" />
              Cash held outside these weights
            </span>
            <span class="tabular-nums text-[var(--text-strong)]">
              {{ money0(stockCash) }} · {{ weightPct(cashWeight) }}
            </span>
          </p>
        </template>
      </GorgCard>
    </div>

    <!-- orders -->
    <div ref="lower" class="grid gap-4">
      <GorgCard :padded="false" class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Recent orders</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Newest first, across the last three sessions.</p>
          </div>
          <GorgButton variant="outline" size="xs">
            <template #lead>
              <Icon name="lucide:receipt-text" class="size-3.5" />
            </template>
            Full blotter
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="order in stockOrders"
            :key="order.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-3 p-4"
          >
            <!-- side: icon + word, never the colour on its own -->
            <span
              class="inline-flex shrink-0 items-center gap-1.5 rounded-field border border-[var(--surface-border)] px-2 py-1 text-xs font-semibold"
              :class="order.side === 'buy'
                ? 'text-[var(--color-info)]'
                : 'text-[var(--color-caution)]'"
            >
              <Icon :name="sideMeta[order.side].icon" class="size-3.5" aria-hidden="true" />
              {{ sideMeta[order.side].label }}
            </span>

            <div class="min-w-32 flex-1">
              <p class="flex items-baseline gap-2">
                <span class="font-mono text-sm font-semibold text-[var(--text-strong)]">{{ order.symbol }}</span>
                <span class="text-xs text-[var(--text-muted)]">{{ order.kind }} order · {{ order.id }}</span>
              </p>
              <p class="mt-0.5 text-xs tabular-nums text-[var(--text-muted)]">
                {{ shares(order.qty) }} shares @ {{ money(order.price) }}
                <span v-if="order.status === 'partial'">
                  · {{ shares(order.filled) }} filled
                </span>
              </p>
            </div>

            <div v-if="order.status === 'partial'" class="w-full sm:w-32">
              <GorgProgress
                :value="(order.filled / order.qty) * 100"
                tone="caution"
                size="xs"
                :label="`${Math.round((order.filled / order.qty) * 100)}% filled`"
              />
            </div>

            <div class="shrink-0 text-end">
              <p class="text-sm font-medium tabular-nums text-[var(--text-strong)]">
                {{ money(order.filled * order.price) }}
              </p>
              <p class="text-xs text-[var(--text-muted)]">
                <time :datetime="order.at.toISOString()">{{ dayTimeLabel(order.at) }}</time>
                · {{ relativeLabel(order.at) }}
              </p>
            </div>

            <GorgBadge :tone="fillMeta[order.status].tone" size="sm" class="shrink-0">
              <Icon :name="fillMeta[order.status].icon" class="size-3.5" aria-hidden="true" />
              {{ fillMeta[order.status].label }}
            </GorgBadge>
          </li>
        </ul>

        <template #footer>
          <p class="px-4 pb-4 text-xs text-[var(--text-muted)]">
            Window return {{ signedPct(windowReturn) }} ({{ signedMoney0(windowPnl) }}) over {{ range }} days.
          </p>
        </template>
      </GorgCard>
    </div>
  </div>
</template>
