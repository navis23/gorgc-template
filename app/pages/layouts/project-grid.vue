<script setup lang="ts">
import type { ProjectAccent, ProjectStatus } from '~/utils/mock-collections'
import { dayLabel, relativeLabel, shortDayLabel } from '~/utils/datetime'
import { projects } from '~/utils/mock-collections'

useHead({ title: 'Project grid' })

/** Each option names the project field it orders by. */
const sortItems = [
  { label: 'Name', value: 'name', icon: 'lucide:case-sensitive' },
  { label: 'Due date', value: 'dueInDays', icon: 'lucide:calendar' },
  { label: 'Progress', value: 'progress', icon: 'lucide:activity' },
]

const { sortKey, sortDirection: direction, visible: sorted } = useCollection(projects, {
  initialSort: 'dueInDays',
  initialDirection: 'asc',
  pageSize: 0,
})

/** Header washes are built from brand tokens, never an image. */
const accents: Record<ProjectAccent, string> = {
  tide: 'from-tide-500 to-tide-800',
  ember: 'from-ember-500 to-ember-800',
  ink: 'from-ink-600 to-ink-900',
  info: 'from-[var(--color-info)] to-tide-800',
  positive: 'from-[var(--color-positive)] to-tide-700',
  caution: 'from-[var(--color-caution)] to-ember-700',
}

const statuses: Record<ProjectStatus, {
  icon: string
  badge: 'positive' | 'caution' | 'critical' | 'brand'
  bar: 'positive' | 'caution' | 'critical' | 'brand'
}> = {
  'on track': { icon: 'lucide:circle-check', badge: 'positive', bar: 'brand' },
  'at risk': { icon: 'lucide:triangle-alert', badge: 'caution', bar: 'caution' },
  'blocked': { icon: 'lucide:octagon-x', badge: 'critical', bar: 'critical' },
  'shipped': { icon: 'lucide:check-check', badge: 'brand', bar: 'positive' },
}

function isOverdue(dueInDays: number, status: ProjectStatus) {
  return dueInDays < 0 && status !== 'shipped'
}

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.05, y: 20 })

const active = computed(() => projects.filter(p => p.status !== 'shipped').length)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Projects</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ active }} in flight · {{ projects.length - active }} shipped
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:plus" class="size-4" />
        </template>
        New project
      </GorgButton>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <span id="sort-label" class="text-xs font-medium text-[var(--text-muted)]">Sort by</span>
      <GorgSelect
        :items="sortItems"
        :model-value="sortKey"
        size="sm"
        aria-labelledby="sort-label"
        class="w-full sm:w-44"
        @update:model-value="value => sortKey = value as string"
      />
      <button
        type="button"
        :aria-pressed="direction === 'desc'"
        class="inline-flex h-9 items-center gap-1.5 rounded-field border border-[var(--surface-border)] px-3 text-xs
               font-medium text-[var(--text-strong)] transition-colors duration-(--duration-snap)
               hover:bg-[var(--surface-sunken)] aria-pressed:border-tide-500 aria-pressed:bg-tide-50
               aria-pressed:text-tide-800 dark:aria-pressed:bg-tide-900/40 dark:aria-pressed:text-tide-100"
        @click="direction = direction === 'asc' ? 'desc' : 'asc'"
      >
        <Icon :name="direction === 'asc' ? 'lucide:arrow-up-narrow-wide' : 'lucide:arrow-down-wide-narrow'" class="size-3.5" aria-hidden="true" />
        {{ direction === 'asc' ? 'Ascending' : 'Descending' }}
      </button>
    </div>

    <ul ref="grid" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="project in sorted" :key="project.id">
        <article
          class="surface-card flex h-full flex-col overflow-hidden shadow-raise
                 transition-[box-shadow,transform] duration-(--duration-base) hover:-translate-y-1 hover:shadow-float"
        >
          <!-- token-driven wash, plus a scrim so the caption always has contrast -->
          <div class="relative h-28 bg-linear-to-br" :class="accents[project.accent]">
            <Icon
              :name="project.icon"
              class="pointer-events-none absolute -end-5 -bottom-7 size-36 text-white/15"
              aria-hidden="true"
            />
            <div class="absolute inset-0 bg-linear-to-t from-ink-950/55 to-transparent" aria-hidden="true" />

            <GorgBadge
              :tone="statuses[project.status].badge"
              variant="solid"
              size="xs"
              class="absolute end-3 top-3 shadow-raise"
            >
              <Icon :name="statuses[project.status].icon" class="size-3" aria-hidden="true" />
              {{ project.status }}
            </GorgBadge>

            <div class="absolute inset-x-4 bottom-3">
              <p class="truncate text-[11px] font-medium text-white/80">{{ project.client }}</p>
              <h2 class="truncate text-base font-semibold text-white">{{ project.name }}</h2>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-4 p-4">
            <p class="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {{ project.summary }}
            </p>

            <div class="mt-auto">
              <div class="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span class="text-[var(--text-muted)]">
                  {{ project.tasks.done }} / {{ project.tasks.total }} tasks
                </span>
                <span class="font-semibold tabular-nums text-[var(--text-strong)]">{{ project.progress }}%</span>
              </div>
              <GorgProgress :value="project.progress" :tone="statuses[project.status].bar" size="xs" />
            </div>
          </div>

          <footer class="flex items-center justify-between gap-3 border-t border-[var(--surface-border)] px-4 py-3">
            <GorgAvatarGroup :people="project.members" :max="3" size="sm" />

            <p
              class="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium"
              :class="isOverdue(project.dueInDays, project.status)
                ? 'text-[var(--color-critical)]'
                : 'text-[var(--text-muted)]'"
            >
              <Icon
                :name="isOverdue(project.dueInDays, project.status) ? 'lucide:calendar-x' : 'lucide:calendar'"
                class="size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span class="truncate">
                <template v-if="isOverdue(project.dueInDays, project.status)">
                  Overdue — due {{ dayLabel(project.dueInDays) }}
                </template>
                <template v-else-if="project.status === 'shipped'">
                  Delivered {{ relativeLabel(project.dueInDays) }}
                </template>
                <template v-else>
                  Due {{ shortDayLabel(project.dueInDays) }} · {{ relativeLabel(project.dueInDays) }}
                </template>
              </span>
            </p>
          </footer>
        </article>
      </li>
    </ul>
  </div>
</template>
