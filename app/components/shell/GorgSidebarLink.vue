<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { useNavActive } from './shell'

const props = withDefaults(defineProps<{
  label: string
  icon?: string
  to?: string
  exact?: boolean
  active?: boolean
  badge?: string | number
  disabled?: boolean
  /** indent for links that live inside a group */
  nested?: boolean
}>(), {})

const emit = defineEmits<{ select: [event: MouseEvent] }>()

const routeActive = useNavActive(() => props.to, () => props.exact)
const isActive = computed(() => props.active ?? routeActive.value)
const el = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <Primitive
    :as="el"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-current="isActive && to ? 'page' : undefined"
    :aria-disabled="disabled || undefined"
    class="group relative flex w-full items-center gap-3 rounded-field py-2 pr-2.5 text-sm font-medium
           transition-[background-color,color] duration-(--duration-snap)"
    :class="[
      nested ? 'pl-9' : 'pl-3',
      isActive
        ? 'bg-tide-50 text-tide-800 dark:bg-tide-900/40 dark:text-tide-50'
        : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]',
      disabled && 'pointer-events-none opacity-40',
    ]"
    @click="emit('select', $event)"
  >
    <span
      v-if="isActive"
      class="absolute inset-y-1.5 left-0 w-0.5 rounded-pill bg-tide-600"
      aria-hidden="true"
    />

    <Icon v-if="icon" :name="icon" class="size-4 shrink-0" />

    <span class="truncate"><slot>{{ label }}</slot></span>

    <slot name="trail">
      <span
        v-if="badge !== undefined && badge !== ''"
        class="ml-auto shrink-0 rounded-pill bg-ember-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ember-800
               dark:bg-ember-950 dark:text-ember-100"
      >{{ badge }}</span>
    </slot>
  </Primitive>
</template>
