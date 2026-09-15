<script setup lang="ts">
const crumbs = useBreadcrumbs()
const nav = useAppNav()
</script>

<template>
  <GorgSidebarLayout :items="nav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <AppToolbar :crumbs="crumbs" />
    </template>
    <slot />
  </GorgSidebarLayout>
</template>
