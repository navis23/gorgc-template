<script setup lang="ts">
withDefaults(defineProps<{
  /** overlay visibility below `lg`; above it the sidebar is always in flow */
  open?: boolean
  width?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
}>(), {
  open: false,
  width: 'md',
  ariaLabel: 'Primary',
})

const widths = {
  sm: 'w-60',
  md: 'w-68',
  lg: 'w-76',
} as const
</script>

<template>
  <aside
    id="gorg-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[var(--surface-border)]
           bg-[var(--surface-raised)] transition-transform duration-(--duration-base) ease-(--ease-entrance)
           lg:static lg:z-auto lg:translate-x-0"
    :class="[widths[width], open ? 'translate-x-0' : '-translate-x-full']"
  >
    <slot name="header" />

    <nav :aria-label="ariaLabel" class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      <slot />
    </nav>

    <div v-if="$slots.footer" class="shrink-0 border-t border-[var(--surface-border)] p-3">
      <slot name="footer" />
    </div>
  </aside>
</template>
