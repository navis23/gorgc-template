<script setup lang="ts">
import { NavigationMenuItem, NavigationMenuTrigger } from 'reka-ui'

defineProps<{
  /** giving a label turns the entry into a trigger for its panel */
  label?: string
  icon?: string
  /** stable value so the menu can be driven from outside */
  value?: string
  disabled?: boolean
}>()
</script>

<template>
  <NavigationMenuItem :value="value">
    <template v-if="label">
      <NavigationMenuTrigger
        :disabled="disabled"
        class="group flex items-center gap-1.5 rounded-field px-3 py-2 text-sm font-medium text-[var(--text-muted)]
               transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]
               data-[state=open]:bg-[var(--surface-sunken)] data-[state=open]:text-[var(--text-strong)]
               disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon v-if="icon" :name="icon" class="size-4 shrink-0" />
        <slot name="label">{{ label }}</slot>
        <Icon
          name="lucide:chevron-down"
          class="size-3.5 shrink-0 opacity-70 transition-transform duration-(--duration-base) ease-(--ease-entrance) group-data-[state=open]:rotate-180"
        />
      </NavigationMenuTrigger>

      <slot />
    </template>

    <slot v-else />
  </NavigationMenuItem>
</template>
