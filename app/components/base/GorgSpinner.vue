<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
}>(), { size: 'md', label: 'Loading' })

const sizes = { xs: 'size-3', sm: 'size-4', md: 'size-6', lg: 'size-9' }
</script>

<template>
  <span role="status" :aria-label="label" class="inline-flex">
    <svg :class="sizes[size]" class="animate-spin text-tide-500" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
  </span>
</template>
