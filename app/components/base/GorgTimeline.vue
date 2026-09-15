<script setup lang="ts">
import type { DayLike } from '~/utils/datetime'
import { dayLabel, dayTimeLabel, demoDate, isoDay, relativeLabel } from '~/utils/datetime'

type Tone = 'neutral' | 'brand' | 'info' | 'positive' | 'caution' | 'critical'
type Size = 'sm' | 'md'

interface TimelineItem {
  id: string | number
  title: string
  description?: string
  icon?: string
  tone?: Tone
  /** a Date, or a day offset from the demo epoch */
  at?: DayLike
  /** trailing detail — actor, amount, reference */
  meta?: string
}

withDefaults(defineProps<{
  items?: TimelineItem[]
  size?: Size
  /** drops the description line's breathing room and keeps the stamp inline */
  compact?: boolean
}>(), {
  items: () => [],
  size: 'md',
  compact: false,
})

function toDate(at: DayLike): Date {
  return typeof at === 'number' ? demoDate(at) : at
}

/**
 * Every label here comes from `~/utils/datetime`. `toLocaleString`/`Intl` read
 * the runtime's ICU data, which differs between Node and the browser, so the
 * server and the client would render different text and Vue would flag a
 * hydration mismatch.
 */
function stamp(at: DayLike): string {
  const date = toDate(at)
  return date.getUTCHours() || date.getUTCMinutes() ? dayTimeLabel(date) : dayLabel(date)
}

function stampRelative(at: DayLike): string {
  return relativeLabel(toDate(at))
}

function stampIso(at: DayLike): string {
  return isoDay(toDate(at))
}

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]',
  brand: 'bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200',
  info: 'bg-[color-mix(in_oklch,var(--color-info)_16%,transparent)] text-[var(--color-info)]',
  positive: 'bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]',
  caution: 'bg-[color-mix(in_oklch,var(--color-caution)_22%,transparent)] text-[var(--color-caution)]',
  critical: 'bg-[color-mix(in_oklch,var(--color-critical)_18%,transparent)] text-[var(--color-critical)]',
}

const sizes: Record<Size, {
  node: string
  icon: string
  title: string
  body: string
  /** node centre, for the rail */
  railStart: string
  /** first pixel below the node */
  railTop: string
  gap: string
}> = {
  sm: {
    node: 'size-6',
    icon: 'size-3',
    title: 'text-xs',
    body: 'text-[0.6875rem]',
    railStart: 'start-3',
    railTop: 'top-7',
    gap: 'gap-2.5',
  },
  md: {
    node: 'size-8',
    icon: 'size-4',
    title: 'text-sm',
    body: 'text-xs',
    railStart: 'start-4',
    railTop: 'top-9',
    gap: 'gap-3',
  },
}
</script>

<template>
  <ol v-if="items.length" class="w-full">
    <li
      v-for="(item, index) in items"
      :key="item.id"
      class="relative flex"
      :class="[
        sizes[size].gap,
        index < items.length - 1 ? (compact ? 'pb-3' : 'pb-5') : 'pb-0',
      ]"
    >
      <span
        v-if="index < items.length - 1"
        class="absolute bottom-0 w-px -translate-x-1/2 bg-[var(--surface-border)] rtl:translate-x-1/2"
        :class="[sizes[size].railStart, sizes[size].railTop]"
        aria-hidden="true"
      />

      <span
        class="relative z-10 grid shrink-0 place-items-center rounded-pill"
        :class="[sizes[size].node, tones[item.tone ?? 'neutral']]"
      >
        <Icon :name="item.icon ?? 'lucide:dot'" :class="sizes[size].icon" aria-hidden="true" />
      </span>

      <div class="min-w-0 flex-1" :class="compact ? 'pt-0.5' : 'pt-1'">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p class="min-w-0 font-medium text-[var(--text-strong)]" :class="sizes[size].title">
            {{ item.title }}
          </p>

          <time
            v-if="item.at !== undefined && compact"
            :datetime="stampIso(item.at)"
            class="shrink-0 whitespace-nowrap text-[var(--text-muted)]"
            :class="sizes[size].body"
          >{{ stampRelative(item.at) }}</time>

          <span
            v-if="item.meta"
            class="ms-auto shrink-0 whitespace-nowrap tabular-nums text-[var(--text-muted)]"
            :class="sizes[size].body"
          >{{ item.meta }}</span>
        </div>

        <p
          v-if="item.description"
          class="mt-0.5 leading-relaxed text-[var(--text-muted)]"
          :class="sizes[size].body"
        >
          {{ item.description }}
        </p>

        <time
          v-if="item.at !== undefined && !compact"
          :datetime="stampIso(item.at)"
          class="mt-1 block text-[var(--text-muted)]"
          :class="sizes[size].body"
        >
          {{ stamp(item.at) }}
          <span class="opacity-70">· {{ stampRelative(item.at) }}</span>
        </time>

        <div v-if="$slots[String(item.id)]" :class="compact ? 'mt-1.5' : 'mt-2'">
          <slot :name="String(item.id)" :item="item" :index="index" />
        </div>
      </div>
    </li>
  </ol>

  <GorgEmptyState
    v-else
    size="sm"
    icon="lucide:history"
    title="Nothing has happened yet"
    description="Activity shows up here as soon as there is some."
  />
</template>
