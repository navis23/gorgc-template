<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { RadioGroupRoot } from 'reka-ui'

interface FieldContext {
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

type OptionValue = string | number
type Size = 'sm' | 'md' | 'lg'

interface Option {
  label: string
  value: OptionValue
  description?: string
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items?: Option[]
  orientation?: 'vertical' | 'horizontal'
  size?: Size
  disabled?: boolean
  error?: boolean | string
  name?: string
  loop?: boolean
  /** Accessible name when the group is not wrapped in a GorgFormGroup. */
  label?: string
}>(), {
  items: () => [],
  orientation: 'vertical',
  size: 'md',
  loop: true,
})

const model = defineModel<OptionValue | null | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)

const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

provide('gorg-radio-group', {
  size: computed(() => props.size),
  invalid: isInvalid,
})
</script>

<template>
  <RadioGroupRoot
    v-model="model"
    :orientation="orientation"
    :disabled="isDisabled"
    :loop="loop"
    :name="name"
    :required="field?.required.value"
    :aria-label="label"
    :aria-invalid="isInvalid || undefined"
    :aria-describedby="field?.describedBy.value"
    class="flex"
    :class="orientation === 'horizontal' ? 'flex-row flex-wrap items-start gap-x-6 gap-y-3' : 'flex-col gap-3'"
  >
    <slot>
      <GorgRadio
        v-for="item in items"
        :key="String(item.value)"
        :value="item.value"
        :label="item.label"
        :description="item.description"
        :disabled="item.disabled"
      />
    </slot>
  </RadioGroupRoot>
</template>
