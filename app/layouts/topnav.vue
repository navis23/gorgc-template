<script setup lang="ts">
const crumbs = useBreadcrumbs()
</script>

<template>
  <GorgTopnavLayout :items="appNav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <AppToolbar :crumbs="crumbs" :show-crumbs="false" />
    </template>
    <slot />
  </GorgTopnavLayout>
</template>
