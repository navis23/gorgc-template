<script setup lang="ts">
import type { GorgDropdownItem } from '../nav/nav'
import type { GorgNavItem } from './shell'
import { isBranchActive, isPathActive, navItemKey } from './shell'

const props = withDefaults(defineProps<{
  items?: GorgNavItem[]
  orientation?: 'horizontal' | 'vertical'
}>(), {
  items: () => [],
  orientation: 'horizontal',
})

const route = useRoute()

function branchActive(item: GorgNavItem) {
  return isBranchActive(route.path, item)
}

function linkActive(item: GorgNavItem) {
  return isPathActive(route.path, item.to, item.exact)
}

/** children of a horizontal entry drop down instead of nesting inline */
function toDropdownItems(item: GorgNavItem): GorgDropdownItem[] {
  return (item.children ?? []).map(child => ({
    label: child.label,
    icon: child.icon,
    to: child.to,
    disabled: child.disabled,
  }))
}

const isVertical = computed(() => props.orientation === 'vertical')
</script>

<template>
  <ul
    class="flex gap-1"
    :class="isVertical ? 'flex-col' : 'flex-row items-center'"
  >
    <li v-for="(item, index) in items" :key="navItemKey(item, index)">
      <GorgDropdown
        v-if="item.children?.length && !isVertical"
        :items="toDropdownItems(item)"
        align="start"
      >
        <template #trigger>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-field px-3 py-2 text-sm font-medium transition-colors duration-(--duration-snap)"
            :class="branchActive(item)
              ? 'bg-tide-50 text-tide-800 dark:bg-tide-900/40 dark:text-tide-50'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
          >
            <Icon v-if="item.icon" :name="item.icon" class="size-4" />
            {{ item.label }}
            <Icon name="lucide:chevron-down" class="size-3.5 opacity-70" />
          </button>
        </template>
      </GorgDropdown>

      <div v-else-if="item.children?.length" class="py-1">
        <p class="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {{ item.label }}
        </p>
        <ul class="flex flex-col gap-0.5">
          <li v-for="(child, childIndex) in item.children" :key="navItemKey(child, childIndex)">
            <GorgSidebarLink
              nested
              :label="child.label"
              :icon="child.icon"
              :to="child.to"
              :exact="child.exact"
              :badge="child.badge"
              :disabled="child.disabled"
            />
          </li>
        </ul>
      </div>

      <NuxtLink
        v-else
        :to="item.to ?? '/'"
        :aria-current="linkActive(item) ? 'page' : undefined"
        class="flex items-center gap-2 rounded-field px-3 py-2 text-sm font-medium transition-colors duration-(--duration-snap)"
        :class="[
          isVertical ? 'w-full' : '',
          linkActive(item)
            ? 'bg-tide-50 text-tide-800 dark:bg-tide-900/40 dark:text-tide-50'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]',
          item.disabled && 'pointer-events-none opacity-40',
        ]"
      >
        <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
        <span class="truncate">{{ item.label }}</span>
        <span
          v-if="item.badge !== undefined && item.badge !== ''"
          class="ml-auto rounded-pill bg-ember-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ember-800 dark:bg-ember-950 dark:text-ember-100"
        >{{ item.badge }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
