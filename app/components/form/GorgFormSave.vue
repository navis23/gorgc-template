<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Drives the "unsaved changes" indicator and unlocks the save button. */
  dirty?: boolean
  loading?: boolean
  disabled?: boolean
  saveLabel?: string
  cancelLabel?: string
  cleanLabel?: string
  dirtyLabel?: string
  /** Pin to the bottom of the viewport, the bottom of the scroll container, or not at all. */
  position?: 'bottom' | 'top' | 'static'
  /** Slide the bar out of the way while the form is untouched. */
  hideWhenClean?: boolean
}>(), {
  saveLabel: 'Save changes',
  cancelLabel: 'Cancel',
  cleanLabel: 'All changes saved',
  dirtyLabel: 'Unsaved changes',
  position: 'bottom',
})

const emit = defineEmits<{
  save: []
  cancel: []
}>()

const visible = computed(() => !props.hideWhenClean || props.dirty === true || props.loading === true)
const canSave = computed(() => props.disabled !== true && props.loading !== true && props.dirty !== false)

const placement = computed(() => {
  if (props.position === 'static')
    return ''
  return props.position === 'top' ? 'sticky top-0 z-30' : 'sticky bottom-0 z-30'
})
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,transform] duration-(--duration-base) ease-(--ease-entrance)"
    enter-from-class="opacity-0 translate-y-2"
    leave-active-class="transition-[opacity,transform] duration-(--duration-snap) ease-(--ease-exit)"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="visible"
      class="flex flex-wrap items-center gap-3 rounded-card border border-[var(--surface-border)]
             bg-[var(--surface-raised)]/85 px-4 py-3 shadow-float backdrop-blur-md"
      :class="placement"
      role="group"
      :aria-label="saveLabel"
    >
      <span class="flex min-w-0 items-center gap-2 text-xs font-medium">
        <span class="relative grid size-2.5 place-items-center">
          <span
            v-if="dirty"
            class="absolute inline-flex size-2.5 animate-ping rounded-pill bg-[var(--color-caution)] opacity-70"
            aria-hidden="true"
          />
          <span
            class="relative inline-flex size-2 rounded-pill"
            :class="dirty ? 'bg-[var(--color-caution)]' : 'bg-[var(--color-positive)]'"
            aria-hidden="true"
          />
        </span>

        <span class="truncate" :class="dirty ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'">
          <slot name="status">{{ dirty ? dirtyLabel : cleanLabel }}</slot>
        </span>
      </span>

      <div class="ms-auto flex items-center gap-2">
        <slot name="actions">
          <GorgButton
            variant="ghost"
            size="sm"
            :disabled="loading"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </GorgButton>

          <GorgButton
            variant="solid"
            size="sm"
            :loading="loading"
            :disabled="!canSave"
            @click="emit('save')"
          >
            {{ saveLabel }}
          </GorgButton>
        </slot>
      </div>
    </div>
  </Transition>
</template>
