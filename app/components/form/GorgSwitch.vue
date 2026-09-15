<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  disabled: ComputedRef<boolean>
}

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  label?: string
  description?: string
  size?: Size
  disabled?: boolean
  name?: string
  id?: string
  /** Put the control before the text instead of after it. */
  align?: 'start' | 'end'
}>(), {
  size: 'md',
  align: 'end',
})

const model = defineModel<boolean>({ default: false })

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const switchId = computed(() => props.id ?? field?.id.value ?? `gorg-switch-${uid}`)
const descriptionId = computed(() => `${switchId.value}-description`)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const sizes: Record<Size, { track: string, thumb: string, travel: string }> = {
  sm: { track: 'h-5 w-9', thumb: 'size-3.5', travel: 'data-[state=checked]:translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'size-4.5', travel: 'data-[state=checked]:translate-x-5' },
  lg: { track: 'h-7 w-13', thumb: 'size-5.5', travel: 'data-[state=checked]:translate-x-6' },
}
</script>

<template>
  <div
    class="flex items-start gap-3"
    :class="isDisabled && 'opacity-60'"
  >
    <SwitchRoot
      :id="switchId"
      v-model="model"
      :disabled="isDisabled"
      :name="name"
      :aria-describedby="description || $slots.description ? descriptionId : field?.describedBy.value"
      class="relative inline-flex shrink-0 items-center rounded-pill border border-transparent p-0.5
             bg-[var(--surface-sunken)] transition-colors duration-(--duration-base)
             data-[state=checked]:bg-tide-600
             data-[disabled]:cursor-not-allowed"
      :class="[sizes[size].track, align === 'end' ? 'order-2 ms-auto' : 'order-1']"
    >
      <SwitchThumb
        class="block rounded-pill bg-white shadow-raise transition-transform duration-(--duration-base)
               ease-(--ease-entrance) will-change-transform"
        :class="[sizes[size].thumb, sizes[size].travel]"
      />
    </SwitchRoot>

    <div
      v-if="label || description || $slots.default || $slots.description"
      class="min-w-0 leading-snug"
      :class="align === 'end' ? 'order-1' : 'order-2'"
    >
      <GorgLabel
        v-if="label || $slots.default"
        :for="switchId"
        :size="size === 'lg' ? 'md' : 'sm'"
        class="cursor-pointer"
      >
        <slot>{{ label }}</slot>
      </GorgLabel>

      <p
        v-if="description || $slots.description"
        :id="descriptionId"
        class="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </div>
</template>
