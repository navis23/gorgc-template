<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { useNavActive, useShellContext } from './shell'

const props = withDefaults(defineProps<{
  label: string
  icon?: string
  to?: string
  exact?: boolean
  active?: boolean
  badge?: string | number
  disabled?: boolean
  nested?: boolean
}>(), {
  icon: 'lucide:dot',
})

const emit = defineEmits<{ select: [event: MouseEvent] }>()

const { collapsed } = useShellContext()
const routeActive = useNavActive(() => props.to, () => props.exact)
const isActive = computed(() => props.active ?? routeActive.value)
const el = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <TooltipProvider :delay-duration="180">
    <TooltipRoot :disabled="!collapsed">
      <TooltipTrigger
        :as="el"
        :to="to"
        :type="to ? undefined : 'button'"
        :aria-current="isActive && to ? 'page' : undefined"
        :aria-disabled="disabled || undefined"
        :aria-label="collapsed ? label : undefined"
        class="group relative flex w-full items-center rounded-field py-2 text-sm font-medium
               transition-[background-color,color] duration-(--duration-snap)"
        :class="[
          collapsed ? 'justify-center px-0' : nested ? 'gap-3 pl-9 pr-2.5' : 'gap-3 px-3',
          isActive
            ? 'bg-tide-50 text-tide-800 dark:bg-tide-900/40 dark:text-tide-50'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]',
          disabled && 'pointer-events-none opacity-40',
        ]"
        @click="emit('select', $event)"
      >
        <span
          v-if="isActive && !collapsed"
          class="absolute inset-y-1.5 left-0 w-0.5 rounded-pill bg-tide-600"
          aria-hidden="true"
        />

        <span class="relative grid shrink-0 place-items-center">
          <Icon :name="icon" class="size-4" />
          <span
            v-if="collapsed && badge !== undefined && badge !== ''"
            class="absolute -right-1.5 -top-1.5 size-2 rounded-pill bg-ember-500 ring-2 ring-[var(--surface-raised)]"
            aria-hidden="true"
          />
        </span>

        <span v-if="!collapsed" class="truncate"><slot>{{ label }}</slot></span>

        <span
          v-if="!collapsed && badge !== undefined && badge !== ''"
          class="ml-auto shrink-0 rounded-pill bg-ember-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ember-800
                 dark:bg-ember-950 dark:text-ember-100"
        >{{ badge }}</span>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          side="right"
          :side-offset="10"
          class="z-[60] rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)]
                 px-2.5 py-1.5 text-xs font-medium text-[var(--text-strong)] shadow-float"
        >
          {{ label }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
