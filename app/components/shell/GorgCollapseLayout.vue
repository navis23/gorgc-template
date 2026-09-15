<script setup lang="ts">
import type { GorgContentWidth, GorgNavItem } from './shell'
import { provideShellContext, useShellOverlay } from './shell'

const props = withDefaults(defineProps<{
  items?: GorgNavItem[]
  title?: string
  subtitle?: string
  width?: GorgContentWidth
  /** localStorage namespace — the collapsed width survives reloads */
  storageKey?: string
}>(), {
  items: () => [],
  title: 'gorg',
  width: 'lg',
  storageKey: 'gorg-collapse',
})

const mobileOpen = useShellOverlay()
const stored = useLocalStorage(`${props.storageKey}:collapsed`, false)

/**
 * What the nav actually renders as. The overlay is always full width, so the
 * stored preference only applies once the sidebar is back in the flow.
 */
const effective = ref(false)
watchEffect(() => { effective.value = stored.value && !mobileOpen.value })

provideShellContext({
  mobileOpen,
  collapsed: effective,
  setMobileOpen: (value) => { mobileOpen.value = value },
  setCollapsed: (value) => { stored.value = value },
  toggleMobile: () => { mobileOpen.value = !mobileOpen.value },
  toggleCollapsed: () => { stored.value = !stored.value },
})

</script>

<template>
  <div class="flex h-svh w-full overflow-hidden bg-[var(--surface-page)]">
    <GorgSidebarBackdrop v-model="mobileOpen" />

    <GorgCollapseSidebar :items="items" :open="mobileOpen">
      <template #header>
        <slot name="brand">
          <header
            class="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--surface-border)]"
            :class="effective ? 'justify-center px-2' : 'px-4'"
          >
            <NuxtLink
              to="/"
              class="flex min-w-0 items-center gap-3 rounded-field outline-offset-4 transition-opacity duration-(--duration-snap) hover:opacity-80"
            >
              <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-600 text-white shadow-raise">
                <Icon name="lucide:hexagon" class="size-5" />
              </span>
              <span v-if="!effective" class="min-w-0">
                <span class="block truncate text-sm font-semibold tracking-tight text-[var(--text-strong)]">{{ title }}</span>
                <span v-if="subtitle" class="block truncate text-xs text-[var(--text-muted)]">{{ subtitle }}</span>
              </span>
            </NuxtLink>
          </header>
        </slot>
      </template>

      <template v-if="$slots.nav" #default>
        <slot name="nav" />
      </template>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </GorgCollapseSidebar>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 lg:px-6"
      >
        <button
          type="button"
          class="grid size-9 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] lg:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="gorg-collapse-sidebar"
          aria-label="Open navigation"
          @click="mobileOpen = true"
        >
          <Icon name="lucide:menu" class="size-5" />
        </button>

        <div class="flex min-w-0 flex-1 items-center gap-3">
          <slot name="toolbar" />
        </div>
      </header>

      <GorgCollapseContent :width="width">
        <slot />
      </GorgCollapseContent>
    </div>
  </div>
</template>
