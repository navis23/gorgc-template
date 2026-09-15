<script setup lang="ts">
import { formatCompact, slotColor } from '~/utils/chart'

interface Row { label: string, value: number, icon?: string }

const props = withDefaults(defineProps<{
  title?: string
  rows: Row[]
  format?: (n: number) => string
  /** Show each row's share of the largest value as a bar. */
  bars?: boolean
}>(), { format: (n: number) => formatCompact(n), bars: true })

const peak = computed(() => Math.max(1, ...props.rows.map(r => r.value)))
const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.05, y: 10 })
</script>

<template>
  <GorgCard>
    <template v-if="title" #title>{{ title }}</template>

    <ul ref="list" class="space-y-3">
      <li v-for="(r, i) in rows" :key="r.label" class="min-w-0">
        <div class="flex items-center gap-2 text-sm">
          <Icon v-if="r.icon" :name="r.icon" class="size-4 shrink-0 text-[var(--text-muted)]" />
          <span class="truncate text-[var(--text-strong)]">{{ r.label }}</span>
          <span class="ms-auto shrink-0 font-medium tabular-nums text-[var(--text-strong)]">
            {{ format(r.value) }}
          </span>
        </div>
        <div v-if="bars" class="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
          <div
            class="h-full rounded-pill transition-[width] duration-(--duration-slow)"
            :style="{ width: `${(r.value / peak) * 100}%`, background: slotColor(i) }"
          />
        </div>
      </li>
    </ul>
  </GorgCard>
</template>
