<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { Label } from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
  required: ComputedRef<boolean>
}

const props = withDefaults(defineProps<{
  /** Id of the control this label names. Falls back to the enclosing GorgFormGroup. */
  for?: string
  required?: boolean
  hint?: string
  size?: 'sm' | 'md'
  /** Keep the label available to screen readers but out of the layout. */
  srOnly?: boolean
}>(), {
  size: 'md',
})

const field = inject<FieldContext | null>('gorg-form-field', null)

const target = computed(() => props.for ?? field?.id.value)
const isRequired = computed(() => props.required === true || field?.required.value === true)

const sizes = {
  sm: 'text-xs',
  md: 'text-sm',
}
</script>

<template>
  <Label
    :for="target"
    class="flex items-baseline gap-1.5 font-medium text-[var(--text-strong)]"
    :class="[sizes[size], srOnly && 'sr-only']"
  >
    <span class="min-w-0">
      <slot />
    </span>

    <span v-if="isRequired" class="leading-none text-[var(--color-critical)]" aria-hidden="true">*</span>
    <span v-if="isRequired" class="sr-only">(required)</span>

    <span
      v-if="hint || $slots.hint"
      class="ms-auto shrink-0 text-xs font-normal text-[var(--text-muted)]"
    >
      <slot name="hint">{{ hint }}</slot>
    </span>
  </Label>
</template>
