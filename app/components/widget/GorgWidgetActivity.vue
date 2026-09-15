<script setup lang="ts">
interface Entry { id: number | string, actor: string, action: string, target?: string, at: string, icon?: string }

defineProps<{ title?: string, entries: Entry[], compact?: boolean }>()

const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.04, y: 8 })
</script>

<template>
  <GorgCard>
    <template v-if="title" #title>{{ title }}</template>

    <ol ref="list" class="relative space-y-4">
      <!-- rail -->
      <span class="absolute start-[11px] top-1 bottom-1 w-px bg-[var(--surface-border)]" aria-hidden="true" />

      <li v-for="e in entries" :key="e.id" class="relative flex gap-3 ps-0">
        <span
          class="relative z-10 grid size-6 shrink-0 place-items-center rounded-pill bg-[var(--surface-raised)] ring-1 ring-[var(--surface-border)]"
        >
          <Icon :name="e.icon ?? 'lucide:dot'" class="size-3.5 text-[var(--text-muted)]" />
        </span>

        <div class="min-w-0 flex-1">
          <!-- flex + gap, because Vue condenses whitespace between inline spans -->
          <p class="flex flex-wrap items-baseline gap-x-1 text-sm text-[var(--text-strong)]">
            <span class="font-medium">{{ e.actor }}</span>
            <span class="text-[var(--text-muted)]">{{ e.action }}</span>
            <span v-if="e.target" class="font-medium">{{ e.target }}</span>
          </p>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ e.at }}</p>
        </div>
      </li>
    </ol>
  </GorgCard>
</template>
