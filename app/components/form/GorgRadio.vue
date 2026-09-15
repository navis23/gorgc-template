<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { RadioGroupIndicator, RadioGroupItem } from 'reka-ui'

type OptionValue = string | number
type Size = 'sm' | 'md' | 'lg'

interface GroupContext {
  size: ComputedRef<Size>
  invalid: ComputedRef<boolean>
}

const props = withDefaults(defineProps<{
  value: OptionValue
  label?: string
  description?: string
  disabled?: boolean
  /** Overrides the size inherited from GorgRadioGroup. */
  size?: Size
  id?: string
}>(), {})

const group = inject<GroupContext | null>('gorg-radio-group', null)

const uid = useId()
const radioId = computed(() => props.id ?? `gorg-radio-${uid}`)
const descriptionId = computed(() => `${radioId.value}-description`)
const resolvedSize = computed<Size>(() => props.size ?? group?.size.value ?? 'md')
const isInvalid = computed(() => group?.invalid.value === true)

const sizes: Record<Size, { dot: string, inner: string, offset: string }> = {
  sm: { dot: 'size-4', inner: 'size-1.5', offset: 'mt-0' },
  md: { dot: 'size-5', inner: 'size-2', offset: 'mt-px' },
  lg: { dot: 'size-6', inner: 'size-2.5', offset: 'mt-0.5' },
}
</script>

<template>
  <div class="flex items-start gap-2.5" :class="disabled && 'opacity-60'">
    <RadioGroupItem
      :id="radioId"
      :value="value"
      :disabled="disabled"
      :aria-describedby="description || $slots.description ? descriptionId : undefined"
      class="grid shrink-0 place-items-center rounded-pill border bg-[var(--surface-raised)]
             transition-[border-color,background-color] duration-(--duration-snap)
             data-[state=checked]:border-tide-600
             data-[disabled]:cursor-not-allowed"
      :class="[
        sizes[resolvedSize].dot,
        sizes[resolvedSize].offset,
        isInvalid ? 'border-[var(--color-critical)]' : 'border-[var(--surface-border)] hover:border-tide-400',
      ]"
    >
      <RadioGroupIndicator class="inline-flex">
        <span class="block rounded-pill bg-tide-600" :class="sizes[resolvedSize].inner" />
      </RadioGroupIndicator>
    </RadioGroupItem>

    <div v-if="label || description || $slots.default || $slots.description" class="min-w-0 leading-snug">
      <GorgLabel
        v-if="label || $slots.default"
        :for="radioId"
        :size="resolvedSize === 'lg' ? 'md' : 'sm'"
        class="cursor-pointer"
      >
        <slot>{{ label }}</slot>
      </GorgLabel>

      <p
        v-if="description || $slots.description"
        :id="descriptionId"
        class="mt-0.5 text-xs text-[var(--text-muted)]"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </div>
</template>
