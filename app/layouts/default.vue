<script setup lang="ts">
const crumbs = useBreadcrumbs()
</script>

<template>
  <GorgSidenavLayout :items="appNav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <AppToolbar :crumbs="crumbs" />
    </template>


    <template #footer>
      <!-- hide-tooltip: the rail item's TooltipPortal reaches this position
           through a nested slot passthrough, which hydrates inconsistently. -->
      <GorgSidenavRailItem label="Help & docs" icon="lucide:life-buoy" hide-tooltip />
    </template>

    <slot />
  </GorgSidenavLayout>
</template>
