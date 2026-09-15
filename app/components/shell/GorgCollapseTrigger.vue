<script setup lang="ts">
import { useShellContext } from './shell'

withDefaults(defineProps<{
  expandLabel?: string
  collapseLabel?: string
}>(), {
  expandLabel: 'Expand navigation',
  collapseLabel: 'Collapse navigation',
})

const { collapsed, toggleCollapsed } = useShellContext()
</script>

<template>
  <button
    type="button"
    :aria-pressed="!collapsed"
    :aria-label="collapsed ? expandLabel : collapseLabel"
    aria-controls="gorg-collapse-sidebar"
    class="flex w-full items-center gap-3 rounded-field px-3 py-2 text-sm font-medium text-[var(--text-muted)]
           transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
    :class="collapsed && 'justify-center px-0'"
    @click="toggleCollapsed"
  >
    <Icon
      name="lucide:chevrons-left"
      class="size-4 shrink-0 transition-transform duration-(--duration-base) ease-(--ease-entrance)"
      :class="collapsed && 'rotate-180'"
    />
    <span v-if="!collapsed" class="truncate">{{ collapseLabel }}</span>
  </button>
</template>
