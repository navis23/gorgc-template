<script setup lang="ts">
withDefaults(defineProps<{
  /** stretch the bar edge to edge instead of centring it on the content column */
  fluid?: boolean
  sticky?: boolean
  ariaLabel?: string
}>(), {
  sticky: true,
  ariaLabel: 'Primary',
})

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <header
    class="z-40 w-full border-b border-[var(--surface-border)] bg-[var(--surface-raised)]"
    :class="sticky && 'sticky top-0'"
  >
    <div
      class="mx-auto flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8"
      :class="!fluid && 'max-w-7xl'"
    >
      <button
        type="button"
        aria-label="Open navigation"
        aria-controls="gorg-topnav-drawer"
        class="grid size-9 shrink-0 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:hidden"
        @click="emit('toggle')"
      >
        <Icon name="lucide:menu" class="size-5" />
      </button>

      <div class="flex shrink-0 items-center">
        <slot name="brand" />
      </div>

      <nav :aria-label="ariaLabel" class="hidden min-w-0 flex-1 lg:block">
        <slot />
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <slot name="toolbar" />
      </div>
    </div>
  </header>
</template>
