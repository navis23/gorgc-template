<script setup lang="ts">
import type { GorgContentWidth, GorgNavItem } from './shell'
import { provideShellContext, useShellOverlay } from './shell'

withDefaults(defineProps<{
  items?: GorgNavItem[]
  title?: string
  subtitle?: string
  width?: GorgContentWidth
  fluid?: boolean
}>(), {
  items: () => [],
  title: 'gorg',
  width: 'lg',
})

const mobileOpen = useShellOverlay()
const collapsed = ref(false)

/** the bar shows its links again at `lg`, so the drawer must not linger */
const isWide = useMediaQuery('(min-width: 64rem)')
watch(isWide, (wide) => {
  if (wide)
    mobileOpen.value = false
})

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
  <div class="flex min-h-svh w-full flex-col bg-[var(--surface-page)]">
    <GorgTopnavBar :fluid="fluid" @toggle="mobileOpen = !mobileOpen">
      <template #brand>
        <slot name="brand">
          <NuxtLink
            to="/"
            class="flex min-w-0 items-center gap-3 rounded-field outline-offset-4 transition-opacity duration-(--duration-snap) hover:opacity-80"
          >
            <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-600 text-white shadow-raise">
              <Icon name="lucide:hexagon" class="size-5" />
            </span>
            <span class="hidden min-w-0 sm:block">
              <span class="block truncate text-sm font-semibold tracking-tight text-[var(--text-strong)]">{{ title }}</span>
              <span v-if="subtitle" class="block truncate text-xs text-[var(--text-muted)]">{{ subtitle }}</span>
            </span>
          </NuxtLink>
        </slot>
      </template>

      <slot name="nav">
        <GorgTopnavLinks :items="items" />
      </slot>

      <template #toolbar>
        <slot name="toolbar" />
      </template>
    </GorgTopnavBar>

    <GorgDrawer
      v-model:open="mobileOpen"
      side="left"
      size="sm"
      :title="title"
    >
      <nav aria-label="Primary">
        <slot name="nav-mobile">
          <GorgTopnavLinks :items="items" orientation="vertical" />
        </slot>
      </nav>
    </GorgDrawer>

    <GorgTopnavContent :width="width">
      <slot />
    </GorgTopnavContent>

    <footer
      v-if="$slots.footer"
      class="border-t border-[var(--surface-border)] bg-[var(--surface-raised)]"
    >
      <div class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>
