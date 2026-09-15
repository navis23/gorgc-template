<script setup lang="ts">
defineProps<{ keys?: string[] }>()
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <kbd
      v-for="k in keys ?? []"
      :key="k"
      class="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-[var(--surface-border)]
             bg-[var(--surface-sunken)] px-1.5 font-sans text-[10px] font-medium text-[var(--text-muted)]"
    >{{ k }}</kbd>
    <slot />
  </span>
</template>
