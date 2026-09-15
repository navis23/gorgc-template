<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  size?: Size
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  readonly?: boolean
  error?: boolean | string
  placeholder?: string
  /** `stacked` puts the steppers in a column on the trailing edge. */
  stepper?: 'split' | 'stacked'
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  id?: string
}>(), {
  size: 'md',
  step: 1,
  stepper: 'split',
})

const model = defineModel<number | null | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const numberId = computed(() => props.id ?? field?.id.value ?? `gorg-number-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const sizes: Record<Size, { field: string, input: string, button: string, icon: string }> = {
  sm: { field: 'h-9 text-sm', input: 'text-sm', button: 'w-8', icon: 'size-3.5' },
  md: { field: 'h-10 text-sm', input: 'text-sm', button: 'w-9', icon: 'size-4' },
  lg: { field: 'h-12 text-base', input: 'text-base', button: 'w-11', icon: 'size-4' },
}

const stepButton = 'grid shrink-0 place-items-center self-stretch text-[var(--text-muted)] '
  + 'transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)] '
  + 'disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
  <NumberFieldRoot
    :id="numberId"
    v-model="model"
    :min="min"
    :max="max"
    :step="step"
    :disabled="isDisabled"
    :readonly="readonly"
    :format-options="formatOptions"
    :locale="locale"
    class="inline-flex w-full items-stretch overflow-hidden rounded-field border bg-[var(--surface-raised)] shadow-raise
           transition-[border-color,box-shadow] duration-(--duration-snap)
           data-[disabled]:cursor-not-allowed data-[disabled]:bg-[var(--surface-sunken)] data-[disabled]:opacity-60"
    :class="[
      sizes[size].field,
      isInvalid ? 'border-[var(--color-critical)]' : 'border-[var(--surface-border)] focus-within:border-tide-500',
    ]"
  >
    <NumberFieldDecrement
      v-if="stepper === 'split'"
      :class="[stepButton, sizes[size].button, 'border-e border-[var(--surface-border)]']"
      aria-label="Decrease value"
    >
      <Icon name="lucide:minus" :class="sizes[size].icon" aria-hidden="true" />
    </NumberFieldDecrement>

    <NumberFieldInput
      :placeholder="placeholder"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="field?.describedBy.value"
      :required="field?.required.value || undefined"
      class="w-full min-w-0 bg-transparent px-3 font-mono tabular-nums text-[var(--text-strong)]
             placeholder:font-sans placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed"
      :class="[sizes[size].input, stepper === 'split' ? 'text-center' : 'text-start']"
    />

    <NumberFieldIncrement
      v-if="stepper === 'split'"
      :class="[stepButton, sizes[size].button, 'border-s border-[var(--surface-border)]']"
      aria-label="Increase value"
    >
      <Icon name="lucide:plus" :class="sizes[size].icon" aria-hidden="true" />
    </NumberFieldIncrement>

    <div
      v-else
      class="flex shrink-0 flex-col border-s border-[var(--surface-border)]"
      :class="sizes[size].button"
    >
      <NumberFieldIncrement
        :class="[stepButton, 'h-1/2 border-b border-[var(--surface-border)]']"
        aria-label="Increase value"
      >
        <Icon name="lucide:chevron-up" class="size-3" aria-hidden="true" />
      </NumberFieldIncrement>
      <NumberFieldDecrement :class="[stepButton, 'h-1/2']" aria-label="Decrease value">
        <Icon name="lucide:chevron-down" class="size-3" aria-hidden="true" />
      </NumberFieldDecrement>
    </div>
  </NumberFieldRoot>
</template>
