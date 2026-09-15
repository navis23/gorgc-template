<script setup lang="ts">
import type { ComputedRef } from 'vue'

/**
 * Field wrapper: owns the generated id, wires label / control / error /
 * hint together and hands the whole lot down through `provide` so the
 * control inside never has to be told what it is called.
 */
interface GorgFieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

const props = withDefaults(defineProps<{
  label?: string
  hint?: string
  help?: string
  error?: string | boolean
  required?: boolean
  disabled?: boolean
  id?: string
  /** Stack the label above the control (default) or sit it alongside. */
  layout?: 'stacked' | 'inline'
}>(), {
  layout: 'stacked',
})

const uid = useId()

const fieldId = computed(() => props.id ?? `gorg-field-${uid}`)
const errorId = computed(() => `${fieldId.value}-error`)
const helpId = computed(() => `${fieldId.value}-help`)

const errorText = computed(() => (typeof props.error === 'string' ? props.error : ''))
const hasErrorText = computed(() => errorText.value.length > 0)
const invalid = computed(() => props.error === true || hasErrorText.value)
const hasHelp = computed(() => Boolean(props.help))

const describedBy = computed(() => {
  const ids = [hasErrorText.value ? errorId.value : null, hasHelp.value ? helpId.value : null].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

provide<GorgFieldContext>('gorg-form-field', {
  id: fieldId,
  describedBy,
  invalid,
  required: computed(() => props.required === true),
  disabled: computed(() => props.disabled === true),
})
</script>

<template>
  <div
    class="w-full"
    :class="layout === 'inline' ? 'sm:grid sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-start sm:gap-4' : ''"
  >
    <GorgLabel
      v-if="label || $slots.label"
      :for="fieldId"
      :required="required"
      :hint="hint"
      :class="layout === 'inline' ? 'sm:mt-2.5' : 'mb-1.5'"
    >
      <slot name="label">{{ label }}</slot>
      <template v-if="$slots.hint" #hint>
        <slot name="hint" />
      </template>
    </GorgLabel>

    <div class="min-w-0">
      <slot :id="fieldId" :invalid="invalid" :described-by="describedBy" />

      <GorgFieldError :id="errorId" :message="errorText" :show="hasErrorText" />

      <p
        v-if="hasHelp && !invalid"
        :id="helpId"
        class="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]"
      >
        {{ help }}
      </p>
    </div>
  </div>
</template>
