<script setup lang="ts">
import type { GorgDropdownItem } from './nav'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'

withDefaults(defineProps<{
  items?: GorgDropdownItem[]
  label?: string
  /** optional heading pinned above the rows */
  heading?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  modal?: boolean
  disabled?: boolean
}>(), {
  items: () => [],
  label: 'Menu',
  side: 'bottom',
  align: 'end',
  sideOffset: 8,
  modal: false,
})

const emit = defineEmits<{ select: [item: GorgDropdownItem, event: Event] }>()

const open = defineModel<boolean>('open', { default: false })

const linkComponent = resolveComponent('NuxtLink')

const rowClass = 'group relative flex select-none items-center gap-2.5 rounded-field px-2.5 py-2 text-sm outline-none '
  + 'transition-colors duration-(--duration-snap) data-disabled:pointer-events-none data-disabled:opacity-40'

function toneClass(item: GorgDropdownItem) {
  return item.destructive
    ? 'text-[var(--color-critical)] data-highlighted:bg-[var(--color-critical)]/10'
    : 'text-[var(--text-strong)] data-highlighted:bg-[var(--surface-sunken)]'
}

function onSelect(item: GorgDropdownItem, event: Event) {
  if (item.disabled) {
    event.preventDefault()
    return
  }
  item.onSelect?.(event)
  emit('select', item, event)
}
</script>

<template>
  <DropdownMenuRoot v-model:open="open" :modal="modal">
    <DropdownMenuTrigger as-child :disabled="disabled">
      <slot name="trigger">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-field border border-[var(--surface-border)] px-3
                 text-sm font-medium text-[var(--text-strong)] transition-colors duration-(--duration-snap)
                 hover:bg-[var(--surface-sunken)] disabled:pointer-events-none disabled:opacity-50"
        >
          {{ label }}
          <Icon name="lucide:chevron-down" class="size-3.5 opacity-70" />
        </button>
      </slot>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        class="z-[60] min-w-52 origin-(--reka-dropdown-menu-content-transform-origin) rounded-card border
               border-[var(--surface-border)] bg-[var(--surface-raised)] p-1.5 shadow-float"
      >
        <DropdownMenuLabel
          v-if="heading"
          class="px-2.5 pb-1.5 pt-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {{ heading }}
        </DropdownMenuLabel>

        <slot>
          <template v-for="(item, index) in items" :key="index">
            <DropdownMenuSeparator
              v-if="item.separator"
              class="my-1.5 h-px bg-[var(--surface-border)]"
            />

            <DropdownMenuSub v-else-if="item.children?.length">
              <DropdownMenuSubTrigger
                :disabled="item.disabled"
                :class="[rowClass, toneClass(item), 'data-[state=open]:bg-[var(--surface-sunken)]']"
              >
                <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0 opacity-80" />
                <span class="truncate">{{ item.label }}</span>
                <Icon name="lucide:chevron-right" class="ml-auto size-3.5 shrink-0 opacity-60" />
              </DropdownMenuSubTrigger>

              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  :side-offset="6"
                  class="z-[60] min-w-48 rounded-card border border-[var(--surface-border)]
                         bg-[var(--surface-raised)] p-1.5 shadow-float"
                >
                  <DropdownMenuItem
                    v-for="(child, childIndex) in item.children"
                    :key="childIndex"
                    :as="child.to ? linkComponent : 'div'"
                    :to="child.to"
                    :disabled="child.disabled"
                    :class="[rowClass, toneClass(child)]"
                    @select="onSelect(child, $event)"
                  >
                    <Icon v-if="child.icon" :name="child.icon" class="size-4 shrink-0 opacity-80" />
                    <span class="truncate">{{ child.label }}</span>
                    <span v-if="child.shortcut" class="ml-auto shrink-0 font-mono text-xs text-[var(--text-muted)]">
                      {{ child.shortcut }}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem
              v-else
              :as="item.to ? linkComponent : 'div'"
              :to="item.to"
              :disabled="item.disabled"
              :class="[rowClass, toneClass(item)]"
              @select="onSelect(item, $event)"
            >
              <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0 opacity-80" />
              <span class="truncate">{{ item.label }}</span>
              <span v-if="item.shortcut" class="ml-auto shrink-0 font-mono text-xs text-[var(--text-muted)]">
                {{ item.shortcut }}
              </span>
            </DropdownMenuItem>
          </template>
        </slot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
