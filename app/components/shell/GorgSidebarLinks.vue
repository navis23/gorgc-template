<script setup lang="ts">
import type { GorgNavItem } from './shell'
import { navItemKey, staggerNav } from './shell'

const props = withDefaults(defineProps<{
  items?: GorgNavItem[]
  /** small uppercase section caption above the list */
  label?: string
  /** stagger the rows in on mount */
  animate?: boolean
}>(), {
  items: () => [],
  animate: true,
})

const list = ref<HTMLElement | null>(null)

onMounted(() => {
  if (props.animate)
    staggerNav(list.value)
})
</script>

<template>
  <div>
    <p
      v-if="label"
      class="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
    >
      {{ label }}
    </p>

    <ul ref="list" class="flex flex-col gap-0.5">
      <li v-for="(item, index) in items" :key="navItemKey(item, index)">
        <GorgSidebarGroup v-if="item.children?.length" :item="item" />
        <GorgSidebarLink
          v-else
          :label="item.label"
          :icon="item.icon"
          :to="item.to"
          :exact="item.exact"
          :badge="item.badge"
          :disabled="item.disabled"
        />
      </li>
      <slot />
    </ul>
  </div>
</template>
