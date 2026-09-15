<script setup lang="ts">
const crumbs = useBreadcrumbs()
</script>

<template>
  <GorgCollapseLayout :items="appNav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <AppToolbar :crumbs="crumbs" />
    </template>
    <slot />
  </GorgCollapseLayout>
</template>
