<script setup lang="ts">
import type { CalEvent, EventKind } from '~/utils/mock-utility'
import { isoDay } from '~/utils/datetime'
import { calendarEvents, eventKindLabel, TODAY_ISO } from '~/utils/mock-utility'

useHead({ title: 'Calendar' })

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const kindTone: Record<EventKind, string> = {
  incident: 'bg-[color-mix(in_oklch,var(--color-critical)_16%,transparent)] text-[var(--color-critical)]',
  release: 'bg-tide-100 text-tide-800 dark:bg-tide-900/50 dark:text-tide-100',
  meeting: 'bg-[color-mix(in_oklch,var(--color-info)_16%,transparent)] text-[var(--color-info)]',
  leave: 'bg-ember-100 text-ember-800 dark:bg-ember-900/50 dark:text-ember-100',
  review: 'bg-[color-mix(in_oklch,var(--color-caution)_20%,transparent)] text-[var(--color-caution)]',
}

const kindIcon: Record<EventKind, string> = {
  incident: 'lucide:siren',
  release: 'lucide:rocket',
  meeting: 'lucide:users',
  leave: 'lucide:palmtree',
  review: 'lucide:eye',
}

const view = ref<'month' | 'week' | 'agenda'>('month')
const kinds = Object.keys(eventKindLabel) as EventKind[]
const active = ref<Set<EventKind>>(new Set(kinds))

function toggleKind(k: EventKind) {
  const next = new Set(active.value)
  next.has(k) ? next.delete(k) : next.add(k)
  active.value = next
}

const events = computed(() => calendarEvents.filter(e => active.value.has(e.kind)))

// Month grid, Monday-first, anchored on the fixed demo date.
const cursor = ref(new Date(TODAY_ISO))

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }))

const grid = computed(() => {
  const y = cursor.value.getUTCFullYear()
  const m = cursor.value.getUTCMonth()
  const first = new Date(Date.UTC(y, m, 1))
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: Array<{ iso: string | null, day: number | null }> = []
  for (let i = 0; i < lead; i++) cells.push({ iso: null, day: null })
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ iso, day: d })
  }
  while (cells.length % 7) cells.push({ iso: null, day: null })
  return cells
})

const byDay = computed(() => {
  const map = new Map<string, CalEvent[]>()
  for (const e of events.value) {
    const list = map.get(e.day) ?? []
    list.push(e)
    map.set(e.day, list)
  }
  for (const list of map.values())
    list.sort((a, b) => a.start.localeCompare(b.start))
  return map
})

function shiftMonth(n: number) {
  const d = cursor.value
  cursor.value = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
}

// Agenda: the next fortnight, grouped by day.
const agenda = computed(() => {
  const out: Array<{ iso: string, label: string, items: CalEvent[] }> = []
  for (let i = 0; i < 14; i++) {
    const iso = isoDay(i)
    const items = byDay.value.get(iso)
    if (items?.length) {
      out.push({
        iso,
        label: new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }),
        items,
      })
    }
  }
  return out
})

const selected = ref<string>(TODAY_ISO)
const selectedEvents = computed(() => byDay.value.get(selected.value) ?? [])
const selectedLabel = computed(() =>
  new Date(selected.value).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Calendar</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ events.length }} of {{ calendarEvents.length }} events shown.
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:plus" class="size-4" />
        </template>
        New event
      </GorgButton>
    </header>

    <!-- controls -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex rounded-field border border-[var(--surface-border)] p-0.5">
        <button
          v-for="v in (['month', 'week', 'agenda'] as const)"
          :key="v"
          type="button"
          class="rounded-[calc(var(--radius-field)-2px)] px-3 py-1.5 text-xs font-medium capitalize transition"
          :class="view === v
            ? 'bg-tide-600 text-white'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
          :aria-pressed="view === v"
          @click="view = v"
        >{{ v }}</button>
      </div>

      <ul class="flex flex-wrap gap-1.5">
        <li v-for="k in kinds" :key="k">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition"
            :class="active.has(k) ? kindTone[k] : 'text-[var(--text-muted)] opacity-50 hover:opacity-100'"
            :aria-pressed="active.has(k)"
            @click="toggleKind(k)"
          >
            <Icon :name="kindIcon[k]" class="size-3.5" />
            {{ eventKindLabel[k] }}
          </button>
        </li>
      </ul>
    </div>

    <!-- MONTH -->
    <div v-if="view === 'month'" class="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <GorgCard :padded="false" class="overflow-hidden">
        <div class="flex items-center justify-between gap-2 border-b border-[var(--surface-border)] p-4">
          <GorgButton variant="ghost" size="xs" aria-label="Previous month" @click="shiftMonth(-1)">
            <Icon name="lucide:chevron-left" class="size-4" />
          </GorgButton>
          <p class="text-sm font-semibold text-[var(--text-strong)]">{{ monthLabel }}</p>
          <GorgButton variant="ghost" size="xs" aria-label="Next month" @click="shiftMonth(1)">
            <Icon name="lucide:chevron-right" class="size-4" />
          </GorgButton>
        </div>

        <div class="overflow-x-auto">
          <div class="min-w-[40rem]">
            <div class="grid grid-cols-7 border-b border-[var(--surface-border)]">
              <abbr
                v-for="d in WEEK" :key="d"
                class="py-2 text-center text-[11px] font-medium text-[var(--text-muted)] no-underline"
              >{{ d }}</abbr>
            </div>

            <div class="grid grid-cols-7">
              <div
                v-for="(c, i) in grid" :key="i"
                class="min-h-24 border-b border-e border-[var(--surface-border)] p-1.5 last:border-e-0"
                :class="[
                  c.iso === null && 'bg-[var(--surface-sunken)]/40',
                  (i + 1) % 7 === 0 && 'border-e-0',
                ]"
              >
                <template v-if="c.iso">
                  <button
                    type="button"
                    class="mb-1 grid size-6 place-items-center rounded-pill text-xs transition"
                    :class="c.iso === TODAY_ISO
                      ? 'bg-tide-600 font-semibold text-white'
                      : c.iso === selected
                        ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
                    :aria-current="c.iso === TODAY_ISO ? 'date' : undefined"
                    @click="selected = c.iso!"
                  >{{ c.day }}</button>

                  <ul class="space-y-0.5">
                    <li v-for="e in (byDay.get(c.iso) ?? []).slice(0, 2)" :key="e.id">
                      <span
                        class="flex items-center gap-1 truncate rounded-[5px] px-1.5 py-0.5 text-[10px] font-medium"
                        :class="kindTone[e.kind]"
                      >
                        <Icon :name="kindIcon[e.kind]" class="size-2.5 shrink-0" />
                        <span class="truncate">{{ e.title }}</span>
                      </span>
                    </li>
                    <li v-if="(byDay.get(c.iso)?.length ?? 0) > 2" class="px-1.5 text-[10px] text-[var(--text-muted)]">
                      +{{ (byDay.get(c.iso)!.length) - 2 }} more
                    </li>
                  </ul>
                </template>
              </div>
            </div>
          </div>
        </div>
      </GorgCard>

      <GorgCard>
        <template #title>{{ selectedLabel }}</template>
        <template #subtitle>
          {{ selectedEvents.length }} {{ selectedEvents.length === 1 ? 'event' : 'events' }}
        </template>

        <ul v-if="selectedEvents.length" class="space-y-3">
          <li v-for="e in selectedEvents" :key="e.id" class="flex gap-3">
            <span class="grid size-8 shrink-0 place-items-center rounded-field" :class="kindTone[e.kind]">
              <Icon :name="kindIcon[e.kind]" class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ e.title }}</p>
              <p class="text-xs text-[var(--text-muted)]">
                {{ e.start }}–{{ e.end }}<template v-if="e.location"> · {{ e.location }}</template>
              </p>
              <GorgAvatarGroup
                v-if="e.attendees.length"
                :people="e.attendees.map(name => ({ name }))"
                size="xs"
                :max="3"
                class="mt-1.5"
              />
            </div>
          </li>
        </ul>

        <GorgEmptyState v-else icon="lucide:calendar-off" title="Nothing scheduled" size="sm" />
      </GorgCard>
    </div>

    <!-- WEEK -->
    <GorgCard v-else-if="view === 'week'" :padded="false" class="overflow-hidden">
      <div class="overflow-x-auto">
        <div class="grid min-w-[52rem] grid-cols-7">
          <div v-for="i in 7" :key="i" class="border-e border-[var(--surface-border)] last:border-e-0">
            <header class="border-b border-[var(--surface-border)] p-3 text-center">
              <p class="text-[11px] font-medium text-[var(--text-muted)]">{{ WEEK[i - 1] }}</p>
              <p
                class="mt-0.5 text-sm font-semibold"
                :class="isoDay(i - 1) === TODAY_ISO ? 'text-tide-600 dark:text-tide-300' : 'text-[var(--text-strong)]'"
              >
                {{ new Date(isoDay(i - 1)).getUTCDate() }}
              </p>
            </header>
            <ul class="min-h-64 space-y-1.5 p-2">
              <li v-for="e in (byDay.get(isoDay(i - 1)) ?? [])" :key="e.id">
                <article class="rounded-field p-2" :class="kindTone[e.kind]">
                  <p class="text-[11px] font-semibold">{{ e.start }}</p>
                  <p class="mt-0.5 text-xs leading-snug">{{ e.title }}</p>
                </article>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </GorgCard>

    <!-- AGENDA -->
    <div v-else class="space-y-4">
      <GorgCard v-for="group in agenda" :key="group.iso" :padded="false">
        <header class="flex items-center gap-2 border-b border-[var(--surface-border)] px-5 py-3">
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">{{ group.label }}</h2>
          <GorgBadge v-if="group.iso === TODAY_ISO" tone="brand" size="xs">Today</GorgBadge>
          <span class="ms-auto text-xs text-[var(--text-muted)]">{{ group.items.length }}</span>
        </header>
        <ul class="divide-y divide-[var(--surface-border)]">
          <li v-for="e in group.items" :key="e.id" class="flex flex-wrap items-center gap-3 px-5 py-3">
            <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--text-muted)]">{{ e.start }}–{{ e.end }}</span>
            <span class="grid size-8 shrink-0 place-items-center rounded-field" :class="kindTone[e.kind]">
              <Icon :name="kindIcon[e.kind]" class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ e.title }}</p>
              <p v-if="e.location" class="truncate text-xs text-[var(--text-muted)]">{{ e.location }}</p>
            </div>
            <GorgAvatarGroup :people="e.attendees.map(name => ({ name }))" size="xs" :max="3" />
          </li>
        </ul>
      </GorgCard>

      <GorgEmptyState v-if="!agenda.length" icon="lucide:calendar-off" title="Nothing in the next two weeks" />
    </div>
  </div>
</template>
