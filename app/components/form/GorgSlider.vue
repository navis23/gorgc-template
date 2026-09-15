<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  disabled: ComputedRef<boolean>
}

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  size?: Size
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  /** Float the current value above each thumb on hover, focus and drag. */
  tooltip?: boolean
  /** Keep the value bubbles on screen at all times. */
  alwaysShowValue?: boolean
  /** Render the min / max bounds underneath the track. */
  showBounds?: boolean
  minStepsBetweenThumbs?: number
  format?: (value: number) => string
  thumbLabels?: string[]
  id?: string
}>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  orientation: 'horizontal',
})

const emit = defineEmits<{
  commit: [value: number | number[]]
}>()

const model = defineModel<number | number[]>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const sliderId = computed(() => props.id ?? field?.id.value ?? `gorg-slider-${uid}`)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)
const isRange = computed(() => Array.isArray(model.value))

const values = computed<number[]>(() => {
  if (Array.isArray(model.value))
    return model.value
  return [model.value ?? props.min]
})

function display(value: number) {
  return props.format ? props.format(value) : String(value)
}

function labelFor(index: number) {
  if (props.thumbLabels?.[index])
    return props.thumbLabels[index]
  if (!isRange.value)
    return 'Value'
  return index === 0 ? 'Minimum value' : 'Maximum value'
}

function pack(next: number[]): number | number[] {
  return isRange.value ? next : (next[0] ?? props.min)
}

function onUpdate(payload: number[] | undefined) {
  if (!payload)
    return
  model.value = pack(payload)
}

function onCommit(payload: number[]) {
  emit('commit', pack(payload))
}

const sizes: Record<Size, { track: string, thumb: string }> = {
  sm: { track: 'h-1 data-[orientation=vertical]:w-1', thumb: 'size-3.5' },
  md: { track: 'h-1.5 data-[orientation=vertical]:w-1.5', thumb: 'size-4' },
  lg: { track: 'h-2 data-[orientation=vertical]:w-2', thumb: 'size-5' },
}

const showBubble = computed(() => props.tooltip === true || props.alwaysShowValue === true)
</script>

<template>
  <div class="w-full">
    <SliderRoot
      :id="sliderId"
      :model-value="values"
      :min="min"
      :max="max"
      :step="step"
      :disabled="isDisabled"
      :orientation="orientation"
      :min-steps-between-thumbs="minStepsBetweenThumbs"
      class="relative flex touch-none select-none items-center
             data-[orientation=horizontal]:w-full
             data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col
             data-[disabled]:opacity-60"
      @update:model-value="onUpdate"
      @value-commit="onCommit"
    >
      <SliderTrack
        class="relative grow overflow-hidden rounded-pill bg-[var(--surface-sunken)]
               data-[orientation=horizontal]:w-full"
        :class="sizes[size].track"
      >
        <SliderRange
          class="absolute rounded-pill bg-tide-500
                 data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderTrack>

      <SliderThumb
        v-for="(value, index) in values"
        :key="index"
        :aria-label="labelFor(index)"
        :aria-describedby="field?.describedBy.value"
        class="group/thumb relative block rounded-pill border-2 border-tide-600 bg-[var(--surface-raised)]
               shadow-raise transition-transform duration-(--duration-snap)
               hover:scale-110 data-[disabled]:pointer-events-none"
        :class="sizes[size].thumb"
      >
        <span
          v-if="showBubble"
          class="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-field bg-ink-900 px-2 py-1
                 font-mono text-xs tabular-nums text-white shadow-float transition-opacity duration-(--duration-snap)
                 dark:bg-ink-700"
          :class="alwaysShowValue
            ? 'opacity-100'
            : 'opacity-0 group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100'"
          aria-hidden="true"
        >
          {{ display(value) }}
        </span>
      </SliderThumb>
    </SliderRoot>

    <div
      v-if="showBounds"
      class="mt-2 flex items-center justify-between font-mono text-xs tabular-nums text-[var(--text-muted)]"
    >
      <span>{{ display(min) }}</span>
      <span>{{ display(max) }}</span>
    </div>
  </div>
</template>
