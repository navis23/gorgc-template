<script setup lang="ts">
import type { GorgDropdownItem } from '~/components/nav/nav'
import type { ReleaseRun, RunStatus } from '~/utils/mock-collections'
import { relativeLabel, releaseRuns } from '~/utils/mock-collections'

useHead({ title: 'List view' })

/** Local copy so row actions (archive, re-run) never mutate the shared fixture. */
const runs = ref<ReleaseRun[]>(releaseRuns.map(run => ({ ...run })))

const query = ref('')
const statusFilter = ref<RunStatus | 'all'>('all')
const selected = ref<string[]>([])

const statusItems = [
  { label: 'Any status', value: 'all' },
  { label: 'Passed', value: 'passed' },
  { label: 'Running', value: 'running' },
  { label: 'Failed', value: 'failed' },
  { label: 'Queued', value: 'queued' },
]

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return runs.value.filter((run) => {
    if (statusFilter.value !== 'all' && run.status !== statusFilter.value)
      return false
    if (!q)
      return true
    return run.title.toLowerCase().includes(q)
      || run.branch.toLowerCase().includes(q)
      || run.author.toLowerCase().includes(q)
      || run.id.includes(q)
  })
})

const statuses: Record<RunStatus, {
  label: string
  icon: string
  tone: 'positive' | 'info' | 'critical' | 'neutral'
  tile: string
}> = {
  passed: { label: 'Passed', icon: 'lucide:check', tone: 'positive', tile: 'bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]' },
  running: { label: 'Running', icon: 'lucide:loader-circle', tone: 'info', tile: 'bg-[color-mix(in_oklch,var(--color-info)_18%,transparent)] text-[var(--color-info)]' },
  failed: { label: 'Failed', icon: 'lucide:x', tone: 'critical', tile: 'bg-[color-mix(in_oklch,var(--color-critical)_15%,transparent)] text-[var(--color-critical)]' },
  queued: { label: 'Queued', icon: 'lucide:clock', tone: 'neutral', tile: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]' },
}

const isSelected = (id: string) => selected.value.includes(id)

function toggle(id: string, on: boolean | 'indeterminate') {
  if (on === true) {
    if (!isSelected(id))
      selected.value.push(id)
  }
  else {
    selected.value = selected.value.filter(s => s !== id)
  }
}

const headerState = computed<boolean | 'indeterminate'>(() => {
  const ids = visible.value.filter(r => isSelected(r.id)).length
  if (!ids)
    return false
  return ids === visible.value.length ? true : 'indeterminate'
})

function toggleAll(on: boolean | 'indeterminate') {
  selected.value = on === true ? visible.value.map(r => r.id) : []
}

function clearSelection() {
  selected.value = []
}

function archiveSelected() {
  runs.value = runs.value.filter(r => !isSelected(r.id))
  clearSelection()
}

function rerunSelected() {
  for (const run of runs.value) {
    if (isSelected(run.id))
      run.status = 'running'
  }
  clearSelection()
}

function rowMenu(run: ReleaseRun): GorgDropdownItem[] {
  return [
    { label: 'Open run', icon: 'lucide:external-link' },
    { label: 'Copy run id', icon: 'lucide:copy', shortcut: run.id },
    { label: 'Re-run', icon: 'lucide:rotate-ccw', onSelect: () => { run.status = 'running' } },
    { separator: true },
    {
      label: 'Archive',
      icon: 'lucide:archive',
      destructive: true,
      onSelect: () => { runs.value = runs.value.filter(r => r.id !== run.id) },
    },
  ]
}

// Dropping a filtered-out row from the list should not keep it selected.
watch(visible, (rows) => {
  const ids = new Set(rows.map(r => r.id))
  selected.value = selected.value.filter(id => ids.has(id))
})

const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.03, y: 12 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Release runs</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ visible.length }} of {{ runs.length }} runs · last 9 days
        </p>
      </div>
      <GorgButton size="sm" variant="outline">
        <template #lead>
          <Icon name="lucide:play" class="size-4" />
        </template>
        Trigger run
      </GorgButton>
    </header>

    <GorgCard :padded="false">
      <div class="flex flex-wrap items-center gap-3 border-b border-[var(--surface-border)] p-4">
        <GorgCheckbox
          :model-value="headerState"
          size="sm"
          label="Select all"
          @update:model-value="toggleAll"
        />

        <GorgInput
          v-model="query"
          placeholder="Search run, branch, author…"
          icon="lucide:search"
          size="sm"
          clearable
          class="w-full sm:ms-2 sm:max-w-xs"
        />

        <GorgSelect
          :items="statusItems"
          :model-value="statusFilter"
          size="sm"
          icon="lucide:filter"
          aria-label="Filter by status"
          class="w-full sm:ms-auto sm:w-44"
          @update:model-value="value => statusFilter = value as RunStatus | 'all'"
        />
      </div>

      <!-- Bulk bar only exists while something is selected. -->
      <div
        v-if="selected.length"
        class="flex flex-wrap items-center gap-2 border-b border-tide-200 bg-tide-50 px-4 py-2.5
               dark:border-tide-900 dark:bg-tide-950/50"
        role="region"
        aria-label="Bulk actions"
      >
        <p class="text-sm font-medium text-tide-900 dark:text-tide-100">
          {{ selected.length }} selected
        </p>
        <div class="ms-auto flex flex-wrap items-center gap-2">
          <GorgButton size="xs" variant="outline" @click="rerunSelected">
            <template #lead>
              <Icon name="lucide:rotate-ccw" class="size-3.5" />
            </template>
            Re-run
          </GorgButton>
          <GorgButton size="xs" variant="outline" @click="archiveSelected">
            <template #lead>
              <Icon name="lucide:archive" class="size-3.5" />
            </template>
            Archive
          </GorgButton>
          <GorgButton size="xs" variant="ghost" @click="clearSelection">Clear</GorgButton>
        </div>
      </div>

      <ul v-if="visible.length" ref="list" class="divide-y divide-[var(--surface-border)]">
        <li
          v-for="run in visible"
          :key="run.id"
          class="flex items-center gap-3 px-4 py-3 transition-colors duration-(--duration-snap)"
          :class="isSelected(run.id) ? 'bg-tide-50/70 dark:bg-tide-950/40' : 'hover:bg-[var(--surface-sunken)]'"
        >
          <GorgCheckbox
            :id="`run-${run.id}`"
            :model-value="isSelected(run.id)"
            size="sm"
            @update:model-value="value => toggle(run.id, value)"
          />
          <GorgLabel :for="`run-${run.id}`" sr-only>Select run {{ run.id }}</GorgLabel>

          <span
            class="grid size-9 shrink-0 place-items-center rounded-field"
            :class="statuses[run.status].tile"
            aria-hidden="true"
          >
            <Icon
              :name="statuses[run.status].icon"
              class="size-4"
              :class="run.status === 'running' && 'animate-spin'"
            />
          </span>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ run.title }}</p>
            <p class="truncate text-xs text-[var(--text-muted)]">
              <span class="font-mono">{{ run.branch }}</span> · {{ run.author }}
            </p>

            <!-- the meta columns fold under the title once the row runs out of room -->
            <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)] lg:hidden">
              <span class="font-medium uppercase tracking-wide">{{ run.env }}</span>
              <span class="tabular-nums">{{ run.duration }}</span>
              <span>{{ relativeLabel(run.ranDaysAgo) }}</span>
              <GorgBadge :tone="statuses[run.status].tone" size="xs" dot>
                {{ statuses[run.status].label }}
              </GorgBadge>
            </p>
          </div>

          <div class="hidden shrink-0 items-center gap-6 text-xs text-[var(--text-muted)] lg:flex">
            <span class="w-24">
              <GorgBadge size="xs" variant="outline">{{ run.env }}</GorgBadge>
            </span>
            <span class="w-16 text-end tabular-nums">{{ run.duration }}</span>
            <span class="w-16 text-end tabular-nums">{{ run.changes }} files</span>
            <span class="w-24 text-end">{{ relativeLabel(run.ranDaysAgo) }}</span>
            <GorgBadge :tone="statuses[run.status].tone" size="xs" dot class="w-20 justify-center">
              {{ statuses[run.status].label }}
            </GorgBadge>
          </div>

          <GorgDropdown :items="rowMenu(run)" align="end">
            <template #trigger>
              <button
                type="button"
                class="grid size-8 shrink-0 place-items-center rounded-field text-[var(--text-muted)]
                       transition-colors duration-(--duration-snap)
                       hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
                :aria-label="`Actions for run ${run.id}`"
              >
                <Icon name="lucide:ellipsis-vertical" class="size-4" />
              </button>
            </template>
          </GorgDropdown>
        </li>
      </ul>

      <GorgEmptyState
        v-else
        icon="lucide:list-x"
        title="No runs match"
        description="Clear the search or widen the status filter."
      >
        <template #action>
          <GorgButton size="sm" variant="outline" @click="query = ''; statusFilter = 'all'">
            Reset filters
          </GorgButton>
        </template>
      </GorgEmptyState>
    </GorgCard>
  </div>
</template>
