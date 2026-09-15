<script setup lang="ts">
import type { GorgContentWidth, GorgNavItem } from './shell'
import { isBranchActive, navItemKey, provideShellContext, useShellOverlay } from './shell'

const props = withDefaults(defineProps<{
  /** top-level rail entries; entries with `children` reveal the secondary panel */
  items?: GorgNavItem[]
  title?: string
  subtitle?: string
  /** override the panel heading, which otherwise mirrors the selected rail item */
  panelTitle?: string
  width?: GorgContentWidth
  storageKey?: string
}>(), {
  items: () => [],
  title: 'gorg',
  width: 'lg',
  storageKey: 'gorg-sidenav',
})

const route = useRoute()
const mobileOpen = useShellOverlay()
const collapsed = usePersistedState(`${props.storageKey}:collapsed`, false)
const picked = ref<string | null>(null)

const branchKey = computed(() => {
  const index = props.items.findIndex(item => isBranchActive(route.path, item))
  const item = index >= 0 ? props.items[index] : undefined
  return item ? navItemKey(item, index) : null
})

const activeKey = computed(() => {
  if (picked.value)
    return picked.value
  if (branchKey.value)
    return branchKey.value
  const first = props.items[0]
  return first ? navItemKey(first, 0) : null
})

const activeItem = computed(
  () => props.items.find((item, index) => navItemKey(item, index) === activeKey.value) ?? null,
)

const hasPanel = computed(() => Boolean(activeItem.value?.children?.length))
const panelOpen = computed(() => hasPanel.value && !collapsed.value)

watch(() => route.path, () => { picked.value = null })

provideShellContext({
  mobileOpen,
  collapsed,
  setMobileOpen: (value) => { mobileOpen.value = value },
  setCollapsed: (value) => { collapsed.value = value },
  toggleMobile: () => { mobileOpen.value = !mobileOpen.value },
  toggleCollapsed: () => { collapsed.value = !collapsed.value },
})

function onSelect(item: GorgNavItem, index: number) {
  const key = navItemKey(item, index)

  if (item.children?.length) {
    if (key === activeKey.value)
      collapsed.value = !collapsed.value
    else
      collapsed.value = false
    picked.value = key
    return
  }

  picked.value = key
  mobileOpen.value = false
}
</script>

<template>
  <div class="flex h-svh w-full overflow-hidden bg-[var(--surface-page)]">
    <GorgSidebarBackdrop v-model="mobileOpen" />

    <aside
      id="gorg-sidenav"
      aria-label="Sidebar"
      class="fixed inset-y-0 left-0 z-50 flex transition-transform duration-(--duration-base) ease-(--ease-entrance)
             lg:static lg:z-auto lg:translate-x-0"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <GorgSidenavRail>
        <template #brand>
          <slot name="brand">
            <GorgSidenavHeader compact :title="title" />
          </slot>
        </template>

        <slot name="nav">
          <GorgSidenavRailItem
            v-for="(item, index) in items"
            :key="navItemKey(item, index)"
            :label="item.label"
            :icon="item.icon"
            :to="item.children?.length ? undefined : item.to"
            :exact="item.exact"
            :badge="item.badge"
            :disabled="item.disabled"
            :active="navItemKey(item, index) === activeKey"
            @select="onSelect(item, index)"
          />
        </slot>

        <template v-if="$slots.footer" #footer>
          <slot name="footer" />
        </template>
      </GorgSidenavRail>

      <GorgSidenavPanel
        :open="panelOpen"
        :title="panelTitle ?? activeItem?.label"
        :subtitle="subtitle"
      >
        <slot name="panel" :item="activeItem">
          <nav aria-label="Section">
            <GorgSidebarLinks :items="activeItem?.children ?? []" />
          </nav>
        </slot>
      </GorgSidenavPanel>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 lg:px-6"
      >
        <button
          type="button"
          class="grid size-9 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="gorg-sidenav"
          aria-label="Open navigation"
          @click="mobileOpen = true"
        >
          <Icon name="lucide:menu" class="size-5" />
        </button>

        <button
          v-if="hasPanel"
          type="button"
          class="hidden size-9 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:grid"
          :aria-pressed="panelOpen"
          aria-label="Toggle section panel"
          @click="collapsed = !collapsed"
        >
          <Icon :name="panelOpen ? 'lucide:panel-left-close' : 'lucide:panel-left-open'" class="size-5" />
        </button>

        <div class="flex min-w-0 flex-1 items-center gap-3">
          <slot name="toolbar" />
        </div>
      </header>

      <GorgSidenavContent :width="width">
        <slot />
      </GorgSidenavContent>
    </div>
  </div>
</template>
