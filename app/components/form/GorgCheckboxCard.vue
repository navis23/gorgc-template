<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

type CheckedState = boolean | 'indeterminate'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
  disabled?: boolean
  error?: boolean | string
  value?: string
  name?: string
  id?: string
  /** Where the tick sits relative to the card body. */
  indicator?: 'start' | 'end'
}>(), {
  indicator: 'end',
})

const model = defineModel<CheckedState>({ default: false })

const uid = useId()
const cardId = computed(() => props.id ?? `gorg-checkbox-card-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string')
const isIndeterminate = computed(() => model.value === 'indeterminate')
</script>

<template>
  <CheckboxRoot
    :id="cardId"
    v-model="model"
    :disabled="disabled"
    :value="value"
    :name="name"
    :aria-invalid="isInvalid || undefined"
    class="group/card flex w-full items-start gap-3 rounded-card border bg-[var(--surface-raised)] p-4 text-start
           shadow-raise transition-[border-color,background-color,box-shadow,transform] duration-(--duration-base)
           hover:shadow-float
           data-[state=checked]:border-tide-500 data-[state=checked]:bg-tide-50/60
           data-[state=indeterminate]:border-tide-500
           data-[disabled]:pointer-events-none data-[disabled]:opacity-60
           dark:data-[state=checked]:bg-tide-900/25"
    :class="[
      indicator === 'start' ? 'flex-row' : 'flex-row-reverse',
      isInvalid ? 'border-[var(--color-critical)]' : 'border-[var(--surface-border)] hover:border-tide-300 dark:hover:border-tide-800',
    ]"
  >
    <span
      class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[0.35rem] border border-[var(--surface-border)]
             bg-[var(--surface-raised)] transition-[background-color,border-color] duration-(--duration-snap)
             group-data-[state=checked]/card:border-tide-600 group-data-[state=checked]/card:bg-tide-600
             group-data-[state=indeterminate]/card:border-tide-600 group-data-[state=indeterminate]/card:bg-tide-600"
    >
      <CheckboxIndicator class="inline-flex text-white">
        <Icon
          :name="isIndeterminate ? 'lucide:minus' : 'lucide:check'"
          class="size-3.5"
          aria-hidden="true"
        />
      </CheckboxIndicator>
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
  </CheckboxRoot>
</template>
