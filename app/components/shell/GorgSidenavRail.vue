<script setup lang="ts">
import { staggerNav } from './shell'

withDefaults(defineProps<{
  ariaLabel?: string
}>(), {
  ariaLabel: 'Primary',
})

const list = ref<HTMLElement | null>(null)

onMounted(() => staggerNav(list.value))
</script>

<template>
  <nav
    :aria-label="ariaLabel"
    class="flex h-full w-[4.5rem] shrink-0 flex-col items-center border-r border-[var(--surface-border)] bg-[var(--surface-raised)] py-4"
  >
    <slot name="brand" />

    <div ref="list" class="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-3 py-1">
      <slot />
    </div>

    <div
      v-if="$slots.footer"
      class="mt-2 flex w-full flex-col items-center gap-1 border-t border-[var(--surface-border)] px-3 pt-3"
    >
      <slot name="footer" />
    </div>
  </nav>
</template>
