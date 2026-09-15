<script setup lang="ts">
import type { GorgContentWidth, GorgNavItem } from './shell'
import { provideShellContext, useShellOverlay } from './shell'

withDefaults(defineProps<{
  items?: GorgNavItem[]
  title?: string
  subtitle?: string
  width?: GorgContentWidth
  sidebarWidth?: 'sm' | 'md' | 'lg'
  /** caption above the generated link list */
  navLabel?: string
}>(), {
  items: () => [],
  title: 'gorg',
  width: 'lg',
  sidebarWidth: 'md',
})

const mobileOpen = useShellOverlay()
const collapsed = ref(false)

provideShellContext({
  mobileOpen,
  collapsed,
  setMobileOpen: (value) => { mobileOpen.value = value },
  setCollapsed: (value) => { collapsed.value = value },
  toggleMobile: () => { mobileOpen.value = !mobileOpen.value },
  toggleCollapsed: () => { collapsed.value = !collapsed.value },
})
</script>

<template>
  <div class="flex h-svh w-full overflow-hidden bg-[var(--surface-page)]">
    <GorgSidebarBackdrop v-model="mobileOpen" />

    <GorgSidebar :open="mobileOpen" :width="sidebarWidth">
      <template #header>
        <slot name="brand">
          <GorgSidebarHeader :title="title" :subtitle="subtitle" @close="mobileOpen = false" />
        </slot>
      </template>

      <slot name="nav">
        <GorgSidebarLinks :items="items" :label="navLabel" />
      </slot>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </GorgSidebar>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 lg:px-6"
      >
        <button
          type="button"
          class="grid size-9 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="gorg-sidebar"
          aria-label="Open navigation"
          @click="mobileOpen = true"
        >
          <Icon name="lucide:menu" class="size-5" />
        </button>

        <div class="flex min-w-0 flex-1 items-center gap-3">
          <slot name="toolbar" />
        </div>
      </header>

      <GorgSidebarContent :width="width">
        <slot />
      </GorgSidebarContent>
    </div>
  </div>
</template>
