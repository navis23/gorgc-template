<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  icon?: string
  to?: string
  /** show the close control that dismisses the mobile overlay */
  dismissible?: boolean
}>(), {
  title: 'gorg',
  icon: 'lucide:hexagon',
  to: '/',
  dismissible: true,
})

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <header class="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--surface-border)] px-4">
    <slot>
      <NuxtLink
        :to="to"
        class="flex min-w-0 items-center gap-3 rounded-field outline-offset-4 transition-opacity duration-(--duration-snap) hover:opacity-80"
      >
        <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-600 text-white shadow-raise">
          <slot name="mark">
            <Icon :name="icon" class="size-5" />
          </slot>
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold tracking-tight text-[var(--text-strong)]">{{ title }}</span>
          <span v-if="subtitle" class="block truncate text-xs text-[var(--text-muted)]">{{ subtitle }}</span>
        </span>
      </NuxtLink>
    </slot>

    <button
      v-if="dismissible"
      type="button"
      aria-label="Close navigation"
      class="ml-auto grid size-9 shrink-0 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:hidden"
      @click="emit('close')"
    >
      <Icon name="lucide:x" class="size-5" />
    </button>
  </header>
</template>
