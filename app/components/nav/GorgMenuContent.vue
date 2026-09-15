<script setup lang="ts">
import { NavigationMenuContent } from 'reka-ui'

const props = withDefaults(defineProps<{
  columns?: 1 | 2 | 3
  /** heading pinned above the grid */
  title?: string
  description?: string
}>(), {
  columns: 2,
})

const grids = {
  1: 'grid-cols-1 md:w-80',
  2: 'grid-cols-1 sm:grid-cols-2 md:w-[36rem]',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:w-[46rem]',
} as const

const grid = computed(() => grids[props.columns])
</script>

<template>
  <NavigationMenuContent class="w-full">
    <div class="p-4">
      <div v-if="title || description" class="mb-3 px-1">
        <p v-if="title" class="text-sm font-semibold text-[var(--text-strong)]">
          {{ title }}
        </p>
        <p v-if="description" class="mt-0.5 text-xs text-[var(--text-muted)]">
          {{ description }}
        </p>
      </div>

      <ul class="grid gap-1" :class="grid">
        <slot />
      </ul>

      <div v-if="$slots.footer" class="mt-3 border-t border-[var(--surface-border)] pt-3">
        <slot name="footer" />
      </div>
    </div>
  </NavigationMenuContent>
</template>
