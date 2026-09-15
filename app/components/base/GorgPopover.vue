<script setup lang="ts">
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

const props = withDefaults(defineProps<{
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  disabled?: boolean
  arrow?: boolean
  /**
   * `'trigger'` locks the panel to the trigger's measured width, `'auto'` lets
   * the content decide, and anything else is taken verbatim as a width utility
   * — `'w-80'`, `'w-(--panel-w)'`.
   */
  width?: string
  /** Seal the page behind the panel — for a popover that owns a short flow. */
  modal?: boolean
  /** Names the panel itself, when the trigger's label is not enough. */
  label?: string
}>(), {
  side: 'bottom',
  align: 'center',
  sideOffset: 8,
  width: 'auto',
  modal: false,
})

const open = defineModel<boolean>('open', { default: false })

const widths: Record<string, string> = {
  trigger: 'w-(--reka-popover-trigger-width)',
  auto: 'w-auto',
}

const widthClass = computed(() => widths[props.width] ?? props.width)

// A disabled trigger still renders, so the guard lives here too: a caller that
// drives `open` through the model can't be talked into opening a dead popover.
function onOpenChange(value: boolean) {
  if (value && props.disabled)
    return
  open.value = value
}

function close() {
  open.value = false
}
</script>

<template>
  <PopoverRoot :open="open" :modal="modal" @update:open="onOpenChange">
    <PopoverTrigger as-child :disabled="disabled">
      <slot name="trigger" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :collision-padding="8"
        :aria-label="label"
        class="z-[60] origin-(--reka-popover-content-transform-origin) rounded-card border
               border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--text-strong)]
               shadow-float focus:outline-none"
        :class="widthClass"
      >
        <!-- The scroll box is nested so the arrow, which hangs outside the
             panel box, is never clipped by `overflow`. -->
        <div class="max-h-(--reka-popover-content-available-height) overflow-y-auto rounded-card p-4">
          <slot :close="close" :open="open" />
        </div>

        <PopoverArrow
          v-if="arrow"
          :width="12"
          :height="6"
          class="fill-[var(--surface-raised)]"
        />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
