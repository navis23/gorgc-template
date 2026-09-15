<script setup lang="ts">
import type { GorgDropdownItem } from '../nav/nav'
import type { GorgNavItem } from './shell'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { navItemKey, useBranchActive, useCollapseMotion, useShellContext } from './shell'

const props = withDefaults(defineProps<{
  item: GorgNavItem
  storageKey?: string
  defaultOpen?: boolean
}>(), {
  storageKey: 'gorg-collapse-group',
  defaultOpen: false,
})

const { collapsed } = useShellContext()

const groupId = props.item.id ?? props.item.to ?? props.item.label
const open = useLocalStorage(`${props.storageKey}:${groupId}`, props.defaultOpen)
const branchActive = useBranchActive(() => props.item)

watch(branchActive, (value) => {
  if (value)
    open.value = true
}, { immediate: true })

const { contentEl, folded } = useCollapseMotion(open)

/** while the rail is narrow the section opens as a flyout instead of inline */
const flyoutItems = computed<GorgDropdownItem[]>(() => [
  { label: props.item.label, disabled: true },
  { separator: true },
  ...(props.item.children ?? []).map(child => ({
    label: child.label,
    icon: child.icon,
    to: child.to,
    disabled: child.disabled,
  })),
])
</script>

<template>
  <GorgDropdown v-if="collapsed" :items="flyoutItems" side="right" align="start">
    <template #trigger>
      <button
        type="button"
        :aria-label="item.label"
        class="relative grid w-full place-items-center rounded-field py-2 transition-colors duration-(--duration-snap)"
        :class="branchActive
          ? 'bg-tide-50 text-tide-800 dark:bg-tide-900/40 dark:text-tide-50'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
      >
        <Icon :name="item.icon ?? 'lucide:folder'" class="size-4" />
      </button>
    </template>
  </GorgDropdown>

  <CollapsibleRoot v-else v-model:open="open" :unmount-on-hide="false">
    <CollapsibleTrigger
      class="group flex w-full items-center gap-3 rounded-field px-3 py-2 text-sm font-medium
             transition-[background-color,color] duration-(--duration-snap)"
      :class="branchActive
        ? 'text-[var(--text-strong)]'
        : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
    >
      <Icon :name="item.icon ?? 'lucide:folder'" class="size-4 shrink-0" />
      <span class="truncate">{{ item.label }}</span>
      <Icon
        name="lucide:chevron-right"
        class="ml-auto size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-(--duration-base) ease-(--ease-entrance) group-data-[state=open]:rotate-90"
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
              <GorgCollapseLink
                nested
                :label="child.label"
                :icon="child.icon ?? 'lucide:minus'"
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
