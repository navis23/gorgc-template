<script setup lang="ts">
import type { OrderStatus } from '~/utils/mock'
import { formatCompact, formatCurrency, groupInt, slotColor } from '~/utils/chart'
import {
  SHOP_DAYS,
  shopCategoryRevenue,
  shopConversionDaily,
  shopDayLabels,
  shopOrders,
  shopOrdersDaily,
  shopProducts,
  shopRefundsDaily,
  shopRevenueDaily,
} from '~/utils/mock'

useHead({ title: 'Ecommerce' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const money = (n: number) => `$${formatCompact(n)}`
const exact = (n: number) => formatCurrency(n)
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

const orders = sum(shopOrdersDaily)
const revenue = sum(shopRevenueDaily)
const refunds = sum(shopRefundsDaily)
const aov = revenue / orders
const conversion = shopConversionDaily.reduce((a, b) => a + b, 0) / shopConversionDaily.length
const refundRate = (refunds / orders) * 100

/* One measure per plot: orders on its own axis, revenue on its own. */
const orderSeries = [{ name: 'Orders', data: shopOrdersDaily }]

/* Category slots are assigned once here and reused by the product
   thumbnails, so a category is the same colour wherever it appears. */
const categoryOrder = shopCategoryRevenue.map(c => c.name)
const categorySlot = (name: string) => slotColor(Math.max(0, categoryOrder.indexOf(name)))

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')

const topProducts = [...shopProducts].sort((a, b) => b.revenue - a.revenue)
const lowStock = shopProducts
  .filter(p => p.stock <= p.reorderAt)
  .sort((a, b) => a.stock / a.reorderAt - b.stock / b.reorderAt)

const statusTone: Record<OrderStatus, 'neutral' | 'brand' | 'info' | 'positive' | 'caution' | 'critical'> = {
  paid: 'info',
  packing: 'neutral',
  shipped: 'brand',
  delivered: 'positive',
  refunded: 'caution',
  failed: 'critical',
}

const statusIcon: Record<OrderStatus, string> = {
  paid: 'lucide:credit-card',
  packing: 'lucide:package',
  shipped: 'lucide:truck',
  delivered: 'lucide:circle-check',
  refunded: 'lucide:rotate-ccw',
  failed: 'lucide:circle-x',
}

const orderColumns = [
  { key: 'id', label: 'Order', width: '8rem', nowrap: true },
  { key: 'customer', label: 'Customer', width: '16rem' },
  { key: 'channel', label: 'Channel' },
  { key: 'items', label: 'Items', align: 'end' as const },
  { key: 'total', label: 'Total', align: 'end' as const },
  { key: 'status', label: 'Status', align: 'center' as const },
  { key: 'placed', label: 'Placed', align: 'end' as const, nowrap: true },
]

const statusFilter = ref<string>('all')
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Packing', value: 'packing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' },
]

const visibleOrders = computed(() =>
  statusFilter.value === 'all'
    ? shopOrders
    : shopOrders.filter(o => o.status === statusFilter.value))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Storefront</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Trailing {{ SHOP_DAYS }} days of trading across web, apps and marketplace.
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:package-plus" class="size-4" />
        </template>
        Add product
      </GorgButton>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Orders"
        :value="orders"
        :delta="0.072"
        icon="lucide:shopping-cart"
        :format="n => formatCompact(n)"
        :sparkline="shopOrdersDaily"
      />
      <GorgStatTile
        label="Average order value"
        :value="aov"
        :delta="0.018"
        icon="lucide:banknote"
        :format="n => `$${n.toFixed(2)}`"
      />
      <GorgStatTile
        label="Conversion rate"
        :value="conversion"
        :delta="0.036"
        icon="lucide:percent"
        :format="n => `${n.toFixed(2)}%`"
        :sparkline="shopConversionDaily"
      />
      <GorgStatTile
        label="Refund rate"
        :value="refundRate"
        :delta="-0.021"
        invert
        icon="lucide:rotate-ccw"
        :format="n => `${n.toFixed(2)}%`"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="lg:col-span-2">
        <GorgChartFrame
          title="Orders per day"
          subtitle="Counts only — revenue is charted separately, never on a second axis"
          :series="orderSeries"
          :labels="shopDayLabels"
          :height="280"
        >
          <GorgLineChart
            :series="orderSeries"
            :labels="shopDayLabels"
            area
            :height="280"
            :format="n => formatCompact(n, 0)"
          />
        </GorgChartFrame>
      </GorgCard>

      <GorgCard>
        <GorgChartFrame
          title="Revenue by category"
          :subtitle="`${money(revenue)} total`"
          :series="shopCategoryRevenue.map(c => ({ name: c.name, data: [c.value] }))"
          :labels="['Revenue']"
          :height="280"
        >
          <div class="grid place-items-center pt-2">
            <GorgDonutChart
              :data="shopCategoryRevenue"
              :size="190"
              center-label="Revenue"
              :format="money"
            />
          </div>
        </GorgChartFrame>
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <GorgCard class="lg:col-span-2">
        <template #title>
          Top products
        </template>
        <template #subtitle>
          Ranked by revenue over the window
        </template>

        <GorgFlexTable label="Top products">
          <GorgFlexTableRow header>
            <GorgFlexTableHeading width="18rem">
              Product
            </GorgFlexTableHeading>
            <GorgFlexTableHeading width="8rem">
              Category
            </GorgFlexTableHeading>
            <GorgFlexTableHeading align="end" width="6rem">
              Sold
            </GorgFlexTableHeading>
            <GorgFlexTableHeading align="end" width="8rem">
              Revenue
            </GorgFlexTableHeading>
            <GorgFlexTableHeading align="end" width="8rem">
              Stock
            </GorgFlexTableHeading>
          </GorgFlexTableRow>

          <GorgFlexTableRow v-for="p in topProducts" :key="p.id">
            <GorgFlexTableCell width="18rem" label="Product">
              <span class="inline-flex min-w-0 items-center gap-3">
                <!-- initial block stands in for a product image; colour is the
                     category's chart slot, so it matches the donut -->
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-field text-xs font-semibold text-white"
                  :style="{ background: categorySlot(p.category) }"
                  aria-hidden="true"
                >{{ initials(p.name) }}</span>
                <span class="min-w-0">
                  <span class="block truncate font-medium text-[var(--text-strong)]">{{ p.name }}</span>
                  <span class="block truncate font-mono text-xs text-[var(--text-muted)]">{{ p.sku }}</span>
                </span>
              </span>
            </GorgFlexTableCell>

            <GorgFlexTableCell width="8rem" label="Category">
              <GorgBadge size="xs">{{ p.category }}</GorgBadge>
            </GorgFlexTableCell>

            <GorgFlexTableCell align="end" width="6rem" label="Sold">
              <span class="tabular-nums">{{ groupInt(p.sold) }}</span>
            </GorgFlexTableCell>

            <GorgFlexTableCell align="end" width="8rem" label="Revenue">
              <span class="font-medium tabular-nums">{{ money(p.revenue) }}</span>
            </GorgFlexTableCell>

            <GorgFlexTableCell align="end" width="8rem" label="Stock">
              <span
                class="inline-flex items-center gap-1.5 tabular-nums"
                :class="p.stock <= p.reorderAt ? 'text-[var(--color-caution)]' : 'text-[var(--text-muted)]'"
              >
                <Icon
                  v-if="p.stock <= p.reorderAt"
                  name="lucide:triangle-alert"
                  class="size-3.5"
                  aria-hidden="true"
                />
                {{ p.stock }}
                <span v-if="p.stock <= p.reorderAt" class="text-xs">low</span>
              </span>
            </GorgFlexTableCell>
          </GorgFlexTableRow>
        </GorgFlexTable>
      </GorgCard>

      <GorgCard>
        <template #title>
          Inventory warnings
        </template>
        <template #subtitle>
          At or below the reorder point
        </template>

        <GorgEmptyState
          v-if="!lowStock.length"
          size="sm"
          icon="lucide:package-check"
          title="Everything is stocked"
          description="No SKU has fallen to its reorder point."
        />

        <ul v-else class="space-y-4">
          <li v-for="p in lowStock" :key="p.id">
            <div class="flex items-start gap-3">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-field text-xs font-semibold text-white"
                :style="{ background: categorySlot(p.category) }"
                aria-hidden="true"
              >{{ initials(p.name) }}</span>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ p.name }}</p>
                <p class="mt-0.5 flex items-center gap-1 text-xs">
                  <Icon
                    :name="p.stock <= p.reorderAt / 4 ? 'lucide:circle-alert' : 'lucide:triangle-alert'"
                    class="size-3.5 shrink-0"
                    :class="p.stock <= p.reorderAt / 4 ? 'text-[var(--color-critical)]' : 'text-[var(--color-caution)]'"
                    aria-hidden="true"
                  />
                  <span :class="p.stock <= p.reorderAt / 4 ? 'text-[var(--color-critical)]' : 'text-[var(--color-caution)]'">
                    {{ p.stock <= p.reorderAt / 4 ? 'Critical' : 'Low' }}
                  </span>
                  <span class="tabular-nums text-[var(--text-muted)]">
                    · {{ p.stock }} left of {{ p.reorderAt }} reorder point
                  </span>
                </p>

                <GorgProgress
                  class="mt-2"
                  :value="Math.min(100, (p.stock / p.reorderAt) * 100)"
                  size="xs"
                  :tone="p.stock <= p.reorderAt / 4 ? 'critical' : 'caution'"
                />
              </div>
            </div>
          </li>
        </ul>

        <template #footer>
          <GorgButton variant="outline" size="sm" block>
            <template #lead>
              <Icon name="lucide:clipboard-list" class="size-4" />
            </template>
            Draft purchase order
          </GorgButton>
        </template>
      </GorgCard>
    </div>

    <GorgCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">Recent orders</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">
            {{ visibleOrders.length }} of {{ shopOrders.length }} shown
          </p>
        </div>
        <GorgSelect
          v-model="statusFilter"
          :items="statusOptions"
          size="sm"
          icon="lucide:funnel"
          class="w-full sm:w-52"
          aria-label="Filter by status"
        />
      </div>

      <GorgTable :columns="orderColumns" :rows="visibleOrders" row-key="id" hoverable striped>
        <template #cell-id="{ value }">
          <span class="font-mono text-xs text-[var(--text-muted)]">{{ value }}</span>
        </template>

        <template #cell-customer="{ value }">
          <div class="flex min-w-0 items-center gap-2.5">
            <GorgAvatar :name="value as string" size="xs" />
            <span class="truncate">{{ value }}</span>
          </div>
        </template>

        <template #cell-channel="{ value }">
          <span class="text-[var(--text-muted)]">{{ value }}</span>
        </template>

        <template #cell-items="{ value }">
          <span class="tabular-nums text-[var(--text-muted)]">{{ value }}</span>
        </template>

        <template #cell-total="{ value }">
          <span class="font-medium tabular-nums">{{ exact(value as number) }}</span>
        </template>

        <template #cell-status="{ value }">
          <GorgBadge :tone="statusTone[value as OrderStatus]" size="xs">
            <Icon :name="statusIcon[value as OrderStatus]" class="size-3" aria-hidden="true" />
            {{ value }}
          </GorgBadge>
        </template>

        <template #cell-placed="{ value }">
          <span class="text-[var(--text-muted)]">{{ value }}</span>
        </template>

        <template #empty>
          <GorgEmptyState
            icon="lucide:search-x"
            title="No orders in that status"
            description="Clear the filter to see the full list again."
          />
        </template>
      </GorgTable>
    </GorgCard>
  </div>
</template>
