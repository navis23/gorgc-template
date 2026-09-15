<script setup lang="ts">
import { NavigationMenuLink } from 'reka-ui'
import { useNavActive } from '../shell/shell'

const props = withDefaults(defineProps<{
  label: string
  to?: string
  exact?: boolean
  icon?: string
  description?: string
  active?: boolean
  /** `bar` sits in the menu row, `card` sits inside a mega panel */
  variant?: 'bar' | 'card'
}>(), {
  variant: 'card',
})

const emit = defineEmits<{ select: [event: Event] }>()

const routeActive = useNavActive(() => props.to, () => props.exact)
const isActive = computed(() => props.active ?? routeActive.value)
const el = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <component :is="variant === 'card' ? 'li' : 'div'">
    <NavigationMenuLink
      :as="el"
      :to="to"
      :active="isActive"
      :aria-current="isActive && to ? 'page' : undefined"
      class="block rounded-field outline-offset-2 transition-colors duration-(--duration-snap)"
      :class="[
        variant === 'card'
          ? 'p-3 hover:bg-[var(--surface-sunken)] data-[active]:bg-tide-50 dark:data-[active]:bg-tide-900/40'
          : 'px-3 py-2 text-sm font-medium hover:bg-[var(--surface-sunken)] data-[active]:bg-tide-50 dark:data-[active]:bg-tide-900/40',
      ]"
      @select="emit('select', $event)"
    >
      <span class="flex items-start gap-3">
        <span
          v-if="icon"
          class="grid size-8 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-tide-700 dark:text-tide-200"
        >
          <Icon :name="icon" class="size-4" />
        </span>

        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-[var(--text-strong)]">
            <slot>{{ label }}</slot>
          </span>
          <span v-if="description" class="mt-0.5 block text-xs leading-relaxed text-[var(--text-muted)]">
            {{ description }}
          </span>
        </span>
      </span>
    </NavigationMenuLink>
  </component>
</template>
