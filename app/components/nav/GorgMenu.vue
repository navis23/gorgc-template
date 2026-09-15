<script setup lang="ts">
import { NavigationMenuIndicator, NavigationMenuList, NavigationMenuRoot, NavigationMenuViewport } from 'reka-ui'

withDefaults(defineProps<{
  ariaLabel?: string
  /** hover intent delay before a panel opens */
  delay?: number
  /** drop the shared viewport — each item then renders its own panel */
  noViewport?: boolean
}>(), {
  ariaLabel: 'Main',
  delay: 160,
})

const value = defineModel<string>({ default: '' })
</script>

<template>
  <NavigationMenuRoot
    v-model="value"
    :delay-duration="delay"
    :aria-label="ariaLabel"
    class="relative z-30 flex w-max items-center"
  >
    <NavigationMenuList class="flex list-none items-center gap-1">
      <slot />

      <NavigationMenuIndicator
        class="absolute top-full z-40 flex h-2 w-(--reka-navigation-menu-indicator-size)
               translate-x-(--reka-navigation-menu-indicator-position) items-end justify-center overflow-hidden
               transition-[width,transform] duration-(--duration-base) ease-(--ease-entrance)
               data-[state=hidden]:opacity-0"
      >
        <span
          class="relative top-1 size-2 rotate-45 rounded-[2px] border-l border-t border-[var(--surface-border)] bg-[var(--surface-raised)]"
          aria-hidden="true"
        />
      </NavigationMenuIndicator>
    </NavigationMenuList>

    <div v-if="!noViewport" class="absolute left-0 top-full flex w-full justify-center">
      <NavigationMenuViewport
        class="relative mt-2.5 h-(--reka-navigation-menu-viewport-height) w-full origin-top overflow-hidden
               rounded-card border border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-float
               transition-[width,height] duration-(--duration-base) ease-(--ease-entrance)
               sm:w-(--reka-navigation-menu-viewport-width)"
      />
    </div>
  </NavigationMenuRoot>
</template>
