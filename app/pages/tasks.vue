<script setup lang="ts">
useHead({ title: 'Tasks' })

type Priority = 'low' | 'normal' | 'high' | 'urgent'
type ColumnKey = 'backlog' | 'progress' | 'review' | 'done'

interface Task {
  id: number
  title: string
  column: ColumnKey
  priority: Priority
  assignee: string
  due?: string
  tags: string[]
  subtasks: { done: number, total: number }
}

const columns: Array<{ key: ColumnKey, label: string, tone: string }> = [
  { key: 'backlog', label: 'Backlog', tone: 'bg-ink-400' },
  { key: 'progress', label: 'In progress', tone: 'bg-[var(--color-info)]' },
  { key: 'review', label: 'In review', tone: 'bg-[var(--color-caution)]' },
  { key: 'done', label: 'Done', tone: 'bg-[var(--color-positive)]' },
]

const priorityTone: Record<Priority, 'neutral' | 'info' | 'caution' | 'critical'> = {
  low: 'neutral', normal: 'info', high: 'caution', urgent: 'critical',
}

const tasks = ref<Task[]>([
  { id: 1, title: 'Rate limiter: switch to monotonic clock', column: 'progress', priority: 'urgent', assignee: 'Tobias Lindqvist', due: 'Today', tags: ['platform'], subtasks: { done: 3, total: 5 } },
  { id: 2, title: 'Write INC-2210 postmortem', column: 'review', priority: 'high', assignee: 'Priya Raghunathan', due: 'Thu', tags: ['incident'], subtasks: { done: 4, total: 4 } },
  { id: 3, title: 'Media pipeline storage projection', column: 'backlog', priority: 'normal', assignee: 'Ingrid Sørensen', tags: ['capacity'], subtasks: { done: 0, total: 3 } },
  { id: 4, title: 'Passkey enrolment flow', column: 'progress', priority: 'high', assignee: 'Amara Osei', due: 'Fri', tags: ['auth', 'frontend'], subtasks: { done: 2, total: 6 } },
  { id: 5, title: 'Deprecate v1 webhooks', column: 'backlog', priority: 'low', assignee: 'Hiroshi Tanaka', tags: ['api'], subtasks: { done: 0, total: 2 } },
  { id: 6, title: 'Quarterly access review', column: 'done', priority: 'normal', assignee: 'Fatima Al-Rashid', tags: ['compliance'], subtasks: { done: 7, total: 7 } },
  { id: 7, title: 'Add trace sampling to checkout', column: 'review', priority: 'normal', assignee: 'Diego Moreno', due: 'Mon', tags: ['observability'], subtasks: { done: 2, total: 3 } },
  { id: 8, title: 'Onboarding docs refresh', column: 'done', priority: 'low', assignee: 'Nnamdi Okafor', tags: ['docs'], subtasks: { done: 5, total: 5 } },
  { id: 9, title: 'Split billing service from monolith', column: 'backlog', priority: 'high', assignee: 'Elif Demir', tags: ['platform', 'billing'], subtasks: { done: 1, total: 9 } },
])

const inColumn = (key: ColumnKey) => tasks.value.filter(t => t.column === key)

const board = useTemplateRef<HTMLElement>('board')
useStagger(board, { each: 0.06, y: 14 })

const totals = computed(() => ({
  open: tasks.value.filter(t => t.column !== 'done').length,
  done: tasks.value.filter(t => t.column === 'done').length,
  urgent: tasks.value.filter(t => t.priority === 'urgent' && t.column !== 'done').length,
}))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Tasks</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ totals.open }} open · {{ totals.done }} done
          <template v-if="totals.urgent">
            · <span class="font-medium text-[var(--color-critical)]">{{ totals.urgent }} urgent</span>
          </template>
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:plus" class="size-4" />
        </template>
        New task
      </GorgButton>
    </header>

    <!-- board scrolls sideways on narrow screens rather than squashing columns -->
    <div class="-mx-1 overflow-x-auto px-1 pb-2">
      <div ref="board" class="grid min-w-[56rem] grid-cols-4 gap-4">
        <section v-for="col in columns" :key="col.key" class="flex min-w-0 flex-col">
          <header class="mb-3 flex items-center gap-2">
            <span class="size-2 rounded-pill" :class="col.tone" aria-hidden="true" />
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">{{ col.label }}</h2>
            <span class="ms-auto text-xs tabular-nums text-[var(--text-muted)]">
              {{ inColumn(col.key).length }}
            </span>
          </header>

          <ul class="flex-1 space-y-3 rounded-card bg-[var(--surface-sunken)] p-3">
            <li v-for="t in inColumn(col.key)" :key="t.id">
              <article class="surface-card p-3 shadow-raise transition-[box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:shadow-float">
                <p class="text-sm font-medium text-[var(--text-strong)]">{{ t.title }}</p>

                <div class="mt-2 flex flex-wrap gap-1">
                  <GorgBadge v-for="tag in t.tags" :key="tag" size="xs" tone="neutral">{{ tag }}</GorgBadge>
                  <GorgBadge :tone="priorityTone[t.priority]" size="xs" dot>{{ t.priority }}</GorgBadge>
                </div>

                <div v-if="t.subtasks.total" class="mt-3">
                  <GorgProgress
                    :value="(t.subtasks.done / t.subtasks.total) * 100"
                    size="xs"
                    :tone="t.subtasks.done === t.subtasks.total ? 'positive' : 'brand'"
                  />
                  <p class="mt-1 text-[11px] text-[var(--text-muted)]">
                    {{ t.subtasks.done }} / {{ t.subtasks.total }} subtasks
                  </p>
                </div>

                <footer class="mt-3 flex items-center gap-2">
                  <GorgTooltip :text="t.assignee">
                    <GorgAvatar :name="t.assignee" size="xs" />
                  </GorgTooltip>
                  <span v-if="t.due" class="ms-auto inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <Icon name="lucide:calendar" class="size-3" />
                    {{ t.due }}
                  </span>
                </footer>
              </article>
            </li>

            <li v-if="!inColumn(col.key).length" class="py-6 text-center text-xs text-[var(--text-muted)]">
              Nothing here
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
