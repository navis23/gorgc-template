<script setup lang="ts">
import type { Series } from '~/utils/chart'
import { slotColor } from '~/utils/chart'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  series?: Series[]
  labels?: string[]
  /** Legend is mandatory for 2+ series; this only hides it for the 1-series case. */
  legend?: boolean
  tableView?: boolean
  height?: number
}>(), { series: () => [], labels: () => [], legend: true, tableView: true, height: 260 })

const showTable = ref(false)

// A single series is named by the title, so it needs no legend box.
const showLegend = computed(() => props.legend && props.series.length >= 2)

const colorOf = (s: Series, i: number) => s.color ?? slotColor(i)
</script>

<template>
  <figure class="min-w-0">
    <figcaption v-if="title || subtitle || tableView" class="mb-3 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h4 v-if="title" class="truncate text-sm font-semibold text-[var(--text-strong)]">{{ title }}</h4>
        <p v-if="subtitle" class="mt-0.5 truncate text-xs text-[var(--text-muted)]">{{ subtitle }}</p>
      </div>

      <button
        v-if="tableView"
        type="button"
        class="shrink-0 inline-flex size-7 items-center justify-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        :aria-pressed="showTable"
        :aria-label="showTable ? 'Show chart' : 'Show data table'"
        @click="showTable = !showTable"
      >
        <Icon :name="showTable ? 'lucide:chart-line' : 'lucide:table'" class="size-4" />
      </button>
    </figcaption>

    <!-- Data table is the accessible equivalent of the plot, not a fallback. -->
    <div v-if="showTable" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--surface-border)] text-start">
            <th scope="col" class="py-2 pe-3 text-start text-xs font-medium text-[var(--text-muted)]">Label</th>
            <th v-for="s in series" :key="s.name" scope="col" class="py-2 px-3 text-end text-xs font-medium text-[var(--text-muted)]">
              {{ s.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(lab, i) in labels" :key="i" class="border-b border-[var(--surface-border)] last:border-0">
            <th scope="row" class="py-2 pe-3 text-start font-normal text-[var(--text-muted)]">{{ lab }}</th>
            <td v-for="s in series" :key="s.name" class="py-2 px-3 text-end tabular-nums text-[var(--text-strong)]">
              {{ s.data[i] ?? '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else :style="{ minHeight: `${height}px` }">
      <slot />
    </div>

    <ul v-if="showLegend && !showTable" class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      <li v-for="(s, i) in series" :key="s.name" class="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <span class="size-2.5 shrink-0 rounded-[3px]" :style="{ background: colorOf(s, i) }" />
        {{ s.name }}
      </li>
    </ul>
  </figure>
</template>
