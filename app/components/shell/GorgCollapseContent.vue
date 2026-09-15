<script setup lang="ts">
import type { GorgContentWidth } from './shell'
import { contentWidths } from './shell'

withDefaults(defineProps<{
  width?: GorgContentWidth
  padded?: boolean
}>(), {
  width: 'lg',
  padded: true,
})
</script>

<template>
  <main
    id="gorg-main"
    tabindex="-1"
    class="min-w-0 flex-1 overflow-y-auto focus-visible:outline-none"
  >
    <div
      class="mx-auto w-full"
      :class="[contentWidths[width], padded && 'px-4 py-6 sm:px-6 lg:px-8 lg:py-8']"
    >
      <slot />
    </div>
  </main>
</template>
