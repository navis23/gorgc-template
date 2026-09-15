<script setup lang="ts">
/**
 * The toolbar every shell layout shares: breadcrumb, theme toggle, account.
 *
 * Single-rooted on purpose. A multi-root (fragment) component placed in a slot
 * hydrates differently from the same markup written inline, and Vue reports a
 * "start of fragment" node mismatch.
 */
withDefaults(defineProps<{
  crumbs?: ReturnType<typeof useBreadcrumbs>['value']
  showCrumbs?: boolean
}>(), { showCrumbs: true })
</script>

<template>
  <div class="flex w-full items-center gap-1">
    <GorgBreadcrumb v-if="showCrumbs && crumbs" :items="crumbs" :max="4" class="hidden sm:block" />

    <GorgThemeToggle class="ms-auto" />

    <GorgDropdown :items="accountMenu" heading="Account">
      <template #trigger>
        <button
          type="button"
          aria-label="Account menu"
          class="grid size-9 place-items-center rounded-pill bg-tide-100 text-sm font-semibold text-tide-800
                 transition-[background-color,transform] duration-(--duration-snap) hover:bg-tide-200 active:scale-[0.96]
                 dark:bg-tide-900/50 dark:text-tide-100 dark:hover:bg-tide-900"
        >
          GO
        </button>
      </template>
    </GorgDropdown>
  </div>
</template>
