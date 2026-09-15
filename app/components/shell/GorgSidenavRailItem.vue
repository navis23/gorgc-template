<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { useNavActive } from './shell'

const props = withDefaults(defineProps<{
  label: string
  icon?: string
  to?: string
  exact?: boolean
  /** force the active look — otherwise derived from the route */
  active?: boolean
  badge?: string | number
  disabled?: boolean
  /** suppress the hover tooltip (the label is already visible somewhere else) */
  hideTooltip?: boolean
}>(), {
  icon: 'lucide:circle',
})

const emit = defineEmits<{ select: [event: MouseEvent] }>()

const routeActive = useNavActive(() => props.to, () => props.exact)
const isActive = computed(() => props.active ?? routeActive.value)
const el = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('select', event)
}
</script>

<template>
  <TooltipProvider :delay-duration="180">
    <TooltipRoot :disabled="hideTooltip">
      <TooltipTrigger
        :as="el"
        :to="to"
        :type="to ? undefined : 'button'"
        :disabled="to ? undefined : disabled"
        :aria-label="label"
        :aria-current="isActive && to ? 'page' : undefined"
        :aria-disabled="disabled || undefined"
        class="group relative grid size-11 place-items-center rounded-field
               transition-[background-color,color,transform] duration-(--duration-snap)
               active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
        :class="isActive
          ? 'bg-tide-600 text-white shadow-raise'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
        @click="onClick"
      >
        <Icon :name="icon" class="size-5" />

        <span
          v-if="isActive"
          class="absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-pill bg-tide-600"
          aria-hidden="true"
        />

        <slot name="badge">
          <span
            v-if="badge !== undefined && badge !== ''"
            class="absolute -right-0.5 -top-0.5 grid min-w-[1.125rem] place-items-center rounded-pill
                   bg-ember-500 px-1 text-[0.625rem] font-bold leading-4 text-white ring-2 ring-[var(--surface-raised)]"
          >{{ badge }}</span>
        </slot>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          :side-offset="10"
          side="right"
          class="z-[60] rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)]
                 px-2.5 py-1.5 text-xs font-medium text-[var(--text-strong)] shadow-float"
        >
          {{ label }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
