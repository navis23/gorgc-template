<script setup lang="ts">
import type { GorgNavItem } from './shell'
import { navItemKey, staggerNav, useShellContext } from './shell'

const props = withDefaults(defineProps<{
  items?: GorgNavItem[]
  /** overlay visibility below `lg` */
  open?: boolean
  ariaLabel?: string
  animate?: boolean
}>(), {
  items: () => [],
  open: false,
  ariaLabel: 'Primary',
  animate: true,
})

const { collapsed } = useShellContext()
const list = ref<HTMLElement | null>(null)

onMounted(() => {
  if (props.animate)
    staggerNav(list.value)
})
</script>

<template>
  <aside
    id="gorg-collapse-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-[var(--surface-border)]
           bg-[var(--surface-raised)] transition-[width,transform] duration-(--duration-base) ease-(--ease-entrance)
           lg:static lg:z-auto lg:translate-x-0"
    :class="[
      collapsed ? 'w-[4.75rem]' : 'w-68',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <slot name="header" />

    <nav :aria-label="ariaLabel" class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      <slot>
        <ul ref="list" class="flex flex-col gap-0.5">
          <li v-for="(item, index) in items" :key="navItemKey(item, index)">
            <GorgCollapseGroup v-if="item.children?.length" :item="item" />
            <GorgCollapseLink
              v-else
              :label="item.label"
              :icon="item.icon"
              :to="item.to"
              :exact="item.exact"
              :badge="item.badge"
              :disabled="item.disabled"
            />
          </li>
        </ul>
      </slot>
    </nav>

    <div class="shrink-0 border-t border-[var(--surface-border)] p-3">
      <slot name="footer" />
      <div class="mt-1 hidden lg:block">
        <GorgCollapseTrigger />
      </div>
    </div>
  </aside>
</template>
