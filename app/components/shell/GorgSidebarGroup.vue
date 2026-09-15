<script setup lang="ts">
import type { GorgNavItem } from './shell'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { navItemKey, useBranchActive, useCollapseMotion } from './shell'

const props = withDefaults(defineProps<{
  item: GorgNavItem
  /** localStorage namespace — one entry per group, so sections stay as left */
  storageKey?: string
  defaultOpen?: boolean
}>(), {
  storageKey: 'gorg-nav-group',
  defaultOpen: false,
})

const groupId = props.item.id ?? props.item.to ?? props.item.label
const open = usePersistedState(`${props.storageKey}:${groupId}`, props.defaultOpen)
const branchActive = useBranchActive(() => props.item)

watch(branchActive, (value) => {
  if (value)
    open.value = true
}, { immediate: true })

const { contentEl, folded } = useCollapseMotion(open)
</script>

<template>
  <CollapsibleRoot v-model:open="open" :unmount-on-hide="false">
    <CollapsibleTrigger
      class="group flex w-full items-center gap-3 rounded-field px-3 py-2 text-sm font-medium
             transition-[background-color,color] duration-(--duration-snap)"
      :class="branchActive
        ? 'text-[var(--text-strong)]'
        : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
    >
      <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
      <span class="truncate">{{ item.label }}</span>
      <span
        v-if="item.badge !== undefined && item.badge !== ''"
        class="ml-auto shrink-0 rounded-pill bg-ember-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ember-800 dark:bg-ember-950 dark:text-ember-100"
      >{{ item.badge }}</span>
      <Icon
        name="lucide:chevron-right"
        class="size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-(--duration-base) ease-(--ease-entrance) group-data-[state=open]:rotate-90"
        :class="item.badge === undefined || item.badge === '' ? 'ml-auto' : ''"
      />
    </CollapsibleTrigger>

    <CollapsibleContent
      force-mount
      :unmount-on-hide="false"
      class="overflow-hidden"
      :inert="!open || undefined"
      :aria-hidden="!open || undefined"
    >
      <div ref="contentEl" class="overflow-hidden" :class="folded && 'h-0 opacity-0'">
        <slot>
          <ul class="mt-0.5 flex flex-col gap-0.5">
            <li v-for="(child, index) in item.children ?? []" :key="navItemKey(child, index)">
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
        </slot>
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
