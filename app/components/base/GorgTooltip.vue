<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

withDefaults(defineProps<{
  text?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delay?: number
  disabled?: boolean
}>(), { side: 'top', align: 'center', delay: 300 })
</script>

<template>
  <TooltipProvider :delay-duration="delay" :disable-hoverable-content="true">
    <TooltipRoot :disabled="disabled">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side" :align="align" :side-offset="6"
          class="z-50 max-w-64 rounded-field bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-ink-50 shadow-float
                 dark:bg-ink-100 dark:text-ink-900
                 data-[state=delayed-open]:pop-in"
        >
          <slot name="content">{{ text }}</slot>
          <TooltipArrow class="fill-ink-900 dark:fill-ink-100" :width="10" :height="5" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
