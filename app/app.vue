<script setup lang="ts">
useHead({
  titleTemplate: t => (t ? `${t} — gorg` : 'gorg'),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
