<script setup lang="ts">
withDefaults(defineProps<{
  /** brand wordmark — hidden in `compact` mode, where only the mark shows */
  title?: string
  subtitle?: string
  /** iconify name for the default mark */
  icon?: string
  to?: string
  compact?: boolean
}>(), {
  title: 'gorg',
  icon: 'lucide:hexagon',
  to: '/',
})
</script>

<template>
  <header
    class="flex shrink-0 items-center"
    :class="compact ? 'w-full justify-center px-2 pb-3' : 'h-16 gap-3 px-4'"
  >
    <NuxtLink
      :to="to"
      class="group flex min-w-0 items-center gap-3 rounded-field outline-offset-4 transition-opacity duration-(--duration-snap) hover:opacity-80"
    >
      <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-600 text-white shadow-raise">
        <slot name="mark">
          <Icon :name="icon" class="size-5" />
        </slot>
      </span>

      <span v-if="!compact" class="min-w-0">
        <span class="block truncate text-sm font-semibold tracking-tight text-[var(--text-strong)]">
          <slot>{{ title }}</slot>
        </span>
        <span v-if="subtitle" class="block truncate text-xs text-[var(--text-muted)]">
          {{ subtitle }}
        </span>
      </span>
    </NuxtLink>

    <div v-if="!compact && $slots.trail" class="ml-auto flex items-center gap-1">
      <slot name="trail" />
    </div>
  </header>
</template>
