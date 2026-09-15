<script setup lang="ts">
import { formatCompact } from '~/utils/chart'

const props = withDefaults(defineProps<{
  label: string
  value: number
  /** Period-over-period change, as a fraction (0.12 = +12%). */
  delta?: number
  icon?: string
  sparkline?: number[]
  format?: (n: number) => string
  /** Decimal places to animate to. Without this a value like 36.8 counts to 37. */
  decimals?: number
  /** For metrics where down is good (churn, latency, cost). */
  invert?: boolean
}>(), { format: (n: number) => formatCompact(n) })

const { display } = useCounter(computed(() => props.value), { duration: 1, decimals: props.decimals })

const good = computed(() => {
  if (props.delta === undefined)
    return null
  return props.invert ? props.delta < 0 : props.delta > 0
})
</script>

<template>
  <GorgCard>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-xs font-medium text-[var(--text-muted)]">{{ label }}</p>
        <p class="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
          {{ format(display) }}
        </p>

        <p
          v-if="delta !== undefined"
          class="mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
          :class="good ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
        >
          <!-- icon + sign, so direction is never colour-alone -->
          <Icon :name="delta >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'" class="size-3.5" />
          {{ delta >= 0 ? '+' : '' }}{{ (delta * 100).toFixed(1) }}%
          <span class="font-normal text-[var(--text-muted)]">vs last period</span>
        </p>
      </div>

      <div
        v-if="icon"
        class="grid size-10 shrink-0 place-items-center rounded-field bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200"
      >
        <Icon :name="icon" class="size-5" />
      </div>
    </div>

    <GorgSparkline v-if="sparkline?.length" :data="sparkline" tone :invert="invert" class="mt-3" />
  </GorgCard>
</template>
