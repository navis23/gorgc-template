<script setup lang="ts">
interface Task { id: number, label: string, done: boolean, due?: string, assignee?: string }

const props = defineProps<{ title?: string, tasks: Task[] }>()
const items = ref<Task[]>([...props.tasks])

const done = computed(() => items.value.filter(t => t.done).length)
const pct = computed(() => (items.value.length ? (done.value / items.value.length) * 100 : 0))
</script>

<template>
  <GorgCard>
    <template v-if="title" #title>{{ title }}</template>
    <template #subtitle>{{ done }} of {{ items.length }} complete</template>

    <GorgProgress :value="pct" size="xs" class="mb-4" />

    <ul class="space-y-1">
      <li v-for="t in items" :key="t.id">
        <label
          class="flex cursor-pointer items-center gap-3 rounded-field px-1.5 py-2 transition hover:bg-[var(--surface-sunken)]"
        >
          <input
            v-model="t.done"
            type="checkbox"
            class="size-4 shrink-0 accent-tide-600"
          >
          <span
            class="min-w-0 flex-1 truncate text-sm transition"
            :class="t.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-strong)]'"
          >{{ t.label }}</span>

          <GorgBadge v-if="t.due && !t.done" tone="caution" size="xs">{{ t.due }}</GorgBadge>
          <GorgAvatar v-if="t.assignee" :name="t.assignee" size="xs" />
        </label>
      </li>
    </ul>
  </GorgCard>
</template>
