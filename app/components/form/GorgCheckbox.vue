<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

type CheckedState = boolean | 'indeterminate'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  label?: string
  description?: string
  size?: Size
  disabled?: boolean
  error?: boolean | string
  /** Submitted value when used inside a native form. */
  value?: string
  name?: string
  id?: string
}>(), {
  size: 'md',
})

const model = defineModel<CheckedState>({ default: false })

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const boxId = computed(() => props.id ?? field?.id.value ?? `gorg-checkbox-${uid}`)
const descriptionId = computed(() => `${boxId.value}-description`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)
const isIndeterminate = computed(() => model.value === 'indeterminate')

const sizes: Record<Size, { box: string, icon: string, text: string, offset: string }> = {
  sm: { box: 'size-4', icon: 'size-3', text: 'text-xs', offset: 'mt-0' },
  md: { box: 'size-5', icon: 'size-3.5', text: 'text-sm', offset: 'mt-px' },
  lg: { box: 'size-6', icon: 'size-4', text: 'text-base', offset: 'mt-0.5' },
}
</script>

<template>
  <div class="flex items-start gap-2.5" :class="isDisabled && 'opacity-60'">
    <CheckboxRoot
      :id="boxId"
      v-model="model"
      :disabled="isDisabled"
      :value="value"
      :name="name"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="description || $slots.description ? descriptionId : field?.describedBy.value"
      class="grid shrink-0 place-items-center rounded-[0.35rem] border bg-[var(--surface-raised)]
             transition-[background-color,border-color,box-shadow] duration-(--duration-snap)
             data-[state=checked]:border-tide-600 data-[state=checked]:bg-tide-600
             data-[state=indeterminate]:border-tide-600 data-[state=indeterminate]:bg-tide-600
             data-[disabled]:cursor-not-allowed"
      :class="[
        sizes[size].box,
        sizes[size].offset,
        isInvalid ? 'border-[var(--color-critical)]' : 'border-[var(--surface-border)] hover:border-tide-400',
      ]"
    >
      <CheckboxIndicator class="inline-flex text-white">
        <Icon
          :name="isIndeterminate ? 'lucide:minus' : 'lucide:check'"
          :class="sizes[size].icon"
          aria-hidden="true"
        />
      </CheckboxIndicator>
    </CheckboxRoot>

    <div v-if="label || description || $slots.default || $slots.description" class="min-w-0 leading-snug">
      <GorgLabel
        v-if="label || $slots.default"
        :for="boxId"
        :size="size === 'lg' ? 'md' : 'sm'"
        class="cursor-pointer"
      >
        <slot>{{ label }}</slot>
      </GorgLabel>

      <p
        v-if="description || $slots.description"
        :id="descriptionId"
        class="mt-0.5 text-xs text-[var(--text-muted)]"
        :class="sizes[size].text === 'text-base' && 'text-sm'"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </div>
</template>
