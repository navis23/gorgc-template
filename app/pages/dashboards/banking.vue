<script setup lang="ts">
import type { BankTransaction } from '~/utils/mock'
import { formatCompact, formatCurrency } from '~/utils/chart'
import {
  bankAccounts,
  bankBalanceHistory,
  bankSpendCategories,
  bankTransactions,
  bankUpcoming,
  dayLabelBack,
  isoDayBack,
} from '~/utils/mock'

useHead({ title: 'Banking' })

const cards = useTemplateRef<HTMLElement>('cards')
useStagger(cards, { each: 0.06 })

const hero = useTemplateRef<HTMLElement>('hero')
useReveal(hero, { y: 16 })

const money = (n: number) =>
  formatCurrency(n)
const compactMoney = (n: number) => `${n < 0 ? '−' : ''}$${formatCompact(Math.abs(n))}`

const totalBalance = bankAccounts.reduce((a, acc) => a + acc.balance, 0)

const firstBalance = bankBalanceHistory[0] ?? 0
const lastBalance = bankBalanceHistory.at(-1) ?? 0
const balanceDelta = firstBalance ? (lastBalance - firstBalance) / firstBalance : 0

const kindIcon: Record<string, string> = {
  Checking: 'lucide:wallet',
  Savings: 'lucide:piggy-bank',
  Credit: 'lucide:credit-card',
  Investment: 'lucide:chart-candlestick',
}

/* -- transactions grouped by day -----------------------------------------
   Day keys come from the fixed demo date, so the grouping is identical on
   the server and in the browser. */
const TODAY = isoDayBack(0)
const YESTERDAY = isoDayBack(1)

function dayHeading(iso: string) {
  if (iso === TODAY)
    return 'Today'
  if (iso === YESTERDAY)
    return 'Yesterday'
  // Walk back until the ISO day matches; the window is small and fixed.
  for (let i = 2; i <= 14; i++) {
    if (isoDayBack(i) === iso)
      return dayLabelBack(i)
  }
  return iso
}

interface DayGroup {
  iso: string
  heading: string
  moneyIn: number
  moneyOut: number
  items: BankTransaction[]
}

const grouped = computed<DayGroup[]>(() => {
  const map = new Map<string, DayGroup>()
  for (const t of bankTransactions) {
    let group = map.get(t.date)
    if (!group) {
      group = { iso: t.date, heading: dayHeading(t.date), moneyIn: 0, moneyOut: 0, items: [] }
      map.set(t.date, group)
    }
    group.items.push(t)
    if (t.amount >= 0)
      group.moneyIn += t.amount
    else
      group.moneyOut += Math.abs(t.amount)
  }
  return [...map.values()].sort((a, b) => (a.iso < b.iso ? 1 : -1))
})

const spendTotal = bankSpendCategories.reduce((a, c) => a + c.value, 0)

const dueSoon = (days: number) => days <= 2
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Accounts</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Balances, movement and scheduled payments across the treasury.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:arrow-left-right" class="size-4" />
          </template>
          Transfer
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:send" class="size-4" />
          </template>
          Pay
        </GorgButton>
      </div>
    </header>

    <!-- balance hero -->
    <div ref="hero" class="js-reveal">
      <GorgCard elevation="float">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
              Total balance
            </p>
            <p class="mt-2 text-3xl font-semibold tabular-nums text-[var(--text-strong)] sm:text-4xl">
              {{ money(totalBalance) }}
            </p>
            <p
              class="mt-2 inline-flex flex-wrap items-center gap-1.5 text-sm font-medium"
              :class="balanceDelta >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
            >
              <Icon
                :name="balanceDelta >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
                class="size-4"
                aria-hidden="true"
              />
              {{ balanceDelta >= 0 ? '+' : '' }}{{ (balanceDelta * 100).toFixed(1) }}%
              <span class="font-normal text-[var(--text-muted)]">over the last 60 days</span>
            </p>
          </div>

          <div class="min-w-0 lg:w-1/2">
            <GorgSparkline :data="bankBalanceHistory" :height="72" tone />
            <div class="mt-1.5 flex justify-between text-xs tabular-nums text-[var(--text-muted)]">
              <span>{{ compactMoney(firstBalance) }}</span>
              <span>{{ compactMoney(lastBalance) }}</span>
            </div>
          </div>
        </div>
      </GorgCard>
    </div>

    <!-- account cards -->
    <div ref="cards" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgCard v-for="account in bankAccounts" :key="account.id" interactive>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ account.name }}</p>
            <p class="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{{ account.mask }}</p>
          </div>
          <span
            class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]"
          >
            <Icon :name="kindIcon[account.kind] ?? 'lucide:wallet'" class="size-4" aria-hidden="true" />
          </span>
        </div>

        <p
          class="mt-3 text-xl font-semibold tabular-nums"
          :class="account.balance < 0 ? 'text-[var(--color-critical)]' : 'text-[var(--text-strong)]'"
        >
          {{ money(account.balance) }}
        </p>

        <div class="mt-1 flex items-center justify-between gap-2">
          <GorgBadge size="xs">{{ account.kind }}</GorgBadge>
          <span
            class="inline-flex items-center gap-1 text-xs font-medium tabular-nums"
            :class="account.delta >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
          >
            <Icon
              :name="account.delta >= 0 ? 'lucide:arrow-up-right' : 'lucide:arrow-down-right'"
              class="size-3.5"
              aria-hidden="true"
            />
            {{ account.delta >= 0 ? '+' : '' }}{{ (account.delta * 100).toFixed(1) }}%
          </span>
        </div>

        <!-- No `tone` here: on a credit line a rising balance is debt, so
             direction-coloured ink would read backwards. -->
        <GorgSparkline :data="account.trend" :height="34" class="mt-3" />
      </GorgCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- transactions, grouped by day -->
      <GorgCard :padded="false" class="lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Transactions</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">Last five days of settled movement.</p>
          </div>
          <GorgButton variant="ghost" size="xs">
            <template #lead>
              <Icon name="lucide:download" class="size-3.5" />
            </template>
            Statement
          </GorgButton>
        </div>

        <div class="overflow-x-auto">
          <ul class="min-w-0">
            <li v-for="group in grouped" :key="group.iso">
              <div
                class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--surface-border)] bg-[var(--surface-sunken)] px-4 py-2"
              >
                <h3 class="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  {{ group.heading }}
                </h3>
                <p class="flex items-center gap-3 text-xs tabular-nums">
                  <span class="inline-flex items-center gap-1 text-[var(--color-positive)]">
                    <Icon name="lucide:arrow-down-left" class="size-3.5" aria-hidden="true" />
                    <span class="sr-only">In</span>
                    {{ compactMoney(group.moneyIn) }}
                  </span>
                  <span class="inline-flex items-center gap-1 text-[var(--color-critical)]">
                    <Icon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
                    <span class="sr-only">Out</span>
                    {{ compactMoney(group.moneyOut) }}
                  </span>
                </p>
              </div>

              <ul class="divide-y divide-[var(--surface-border)]">
                <li
                  v-for="t in group.items"
                  :key="t.id"
                  class="flex items-center gap-3 px-4 py-3 transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
                >
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-pill"
                    :class="t.amount >= 0
                      ? 'bg-[color-mix(in_oklch,var(--color-positive)_16%,transparent)] text-[var(--color-positive)]'
                      : 'bg-[color-mix(in_oklch,var(--color-critical)_14%,transparent)] text-[var(--color-critical)]'"
                  >
                    <Icon
                      :name="t.amount >= 0 ? 'lucide:arrow-down-left' : 'lucide:arrow-up-right'"
                      class="size-4"
                      aria-hidden="true"
                    />
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ t.merchant }}</p>
                    <p class="truncate text-xs text-[var(--text-muted)]">
                      {{ t.category }} · {{ t.method }}
                    </p>
                  </div>

                  <p
                    class="shrink-0 text-sm font-medium tabular-nums"
                    :class="t.amount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
                  >
                    {{ t.amount >= 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
                  </p>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </GorgCard>

      <div class="space-y-4">
        <GorgCard>
          <GorgChartFrame
            title="Spending by category"
            :subtitle="`${compactMoney(spendTotal)} out this month`"
            :series="bankSpendCategories.map(c => ({ name: c.name, data: [c.value] }))"
            :labels="['Spend']"
            :height="240"
          >
            <div class="grid place-items-center pt-1">
              <GorgDonutChart
                :data="bankSpendCategories"
                :size="182"
                center-label="Spend"
                :format="n => compactMoney(n)"
              />
            </div>
          </GorgChartFrame>
        </GorgCard>

        <GorgCard>
          <template #title>
            Upcoming payments
          </template>
          <template #subtitle>
            Next thirty days
          </template>

          <ul class="-mx-1 divide-y divide-[var(--surface-border)]">
            <li
              v-for="payment in bankUpcoming"
              :key="payment.id"
              class="flex items-start gap-3 px-1 py-3 first:pt-0 last:pb-0"
            >
              <span
                class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <Icon
                  :name="payment.autopay ? 'lucide:repeat' : 'lucide:calendar-clock'"
                  class="size-4"
                  aria-hidden="true"
                />
              </span>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ payment.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ payment.detail }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-1.5">
                  <GorgBadge
                    :tone="dueSoon(payment.daysAway) ? 'caution' : 'neutral'"
                    size="xs"
                  >
                    <Icon
                      v-if="dueSoon(payment.daysAway)"
                      name="lucide:triangle-alert"
                      class="size-3"
                      aria-hidden="true"
                    />
                    Due {{ payment.dueLabel }}
                  </GorgBadge>
                  <GorgBadge v-if="payment.autopay" tone="brand" size="xs">Autopay</GorgBadge>
                  <GorgBadge v-else tone="neutral" variant="outline" size="xs">Manual</GorgBadge>
                </p>
              </div>

              <p class="shrink-0 text-sm font-medium tabular-nums text-[var(--text-strong)]">
                {{ compactMoney(payment.amount) }}
              </p>
            </li>
          </ul>
        </GorgCard>
      </div>
    </div>
  </div>
</template>
