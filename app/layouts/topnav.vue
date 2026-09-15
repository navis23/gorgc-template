<script setup lang="ts">
const crumbs = useBreadcrumbs()
const nav = useAppNav()
</script>

<template>
  <GorgTopnavLayout :items="nav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <AppToolbar :crumbs="crumbs" :show-crumbs="false" />
    </template>
    <slot />
  </GorgTopnavLayout>
</template>
