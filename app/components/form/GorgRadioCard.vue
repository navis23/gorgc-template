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
  title?: string
  description?: string
  icon?: string
  disabled?: boolean
  id?: string
  /** Where the selection dot sits relative to the card body. */
  indicator?: 'start' | 'end'
}>(), {
  indicator: 'end',
})

const group = inject<GroupContext | null>('gorg-radio-group', null)

const uid = useId()
const cardId = computed(() => props.id ?? `gorg-radio-card-${uid}`)
const isInvalid = computed(() => group?.invalid.value === true)
</script>

<template>
  <RadioGroupItem
    :id="cardId"
    :value="value"
    :disabled="disabled"
    class="group/card flex w-full items-start gap-3 rounded-card border bg-[var(--surface-raised)] p-4 text-start
           shadow-raise transition-[border-color,background-color,box-shadow] duration-(--duration-base)
           hover:shadow-float
           data-[state=checked]:border-tide-500 data-[state=checked]:bg-tide-50/60
           data-[disabled]:pointer-events-none data-[disabled]:opacity-60
           dark:data-[state=checked]:bg-tide-900/25"
    :class="[
      indicator === 'start' ? 'flex-row' : 'flex-row-reverse',
      isInvalid ? 'border-[var(--color-critical)]' : 'border-[var(--surface-border)] hover:border-tide-300 dark:hover:border-tide-800',
    ]"
  >
    <span
      class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border border-[var(--surface-border)]
             bg-[var(--surface-raised)] transition-colors duration-(--duration-snap)
             group-data-[state=checked]/card:border-tide-600"
    >
      <RadioGroupIndicator class="inline-flex">
        <span class="block size-2 rounded-pill bg-tide-600" />
      </RadioGroupIndicator>
    </span>

    <span class="flex min-w-0 flex-1 items-start gap-3">
      <span
        v-if="icon || $slots.icon"
        class="grid size-10 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-tide-600
               transition-colors duration-(--duration-base)
               group-data-[state=checked]/card:bg-tide-100 dark:group-data-[state=checked]/card:bg-tide-900/50"
      >
        <slot name="icon">
          <Icon v-if="icon" :name="icon" class="size-5" aria-hidden="true" />
        </slot>
      </span>

      <span class="min-w-0 flex-1">
        <span class="block text-sm font-semibold text-[var(--text-strong)]">
          <slot name="title">{{ title }}</slot>
        </span>
        <span
          v-if="description || $slots.description"
          class="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]"
        >
          <slot name="description">{{ description }}</slot>
        </span>
        <slot />
      </span>
    </span>
  </RadioGroupItem>
</template>
