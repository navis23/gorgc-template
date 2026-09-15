<script setup lang="ts">
import type { ComputedRef } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'

interface FieldContext {
  id: ComputedRef<string>
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
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items?: Option[]
  placeholder?: string
  size?: Size
  error?: boolean | string
  disabled?: boolean
  multiple?: boolean
  icon?: string
  emptyText?: string
  id?: string
}>(), {
  items: () => [],
  placeholder: 'Search…',
  size: 'md',
  emptyText: 'No matches',
})

const model = defineModel<OptionValue | OptionValue[] | null | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const comboId = computed(() => props.id ?? field?.id.value ?? `gorg-combobox-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const byValue = computed(() => new Map(props.items.map(item => [item.value, item])))

const chips = computed<Option[]>(() => {
  if (!props.multiple || !Array.isArray(model.value))
    return []
  return model.value
    .map(value => byValue.value.get(value))
    .filter((item): item is Option => Boolean(item))
})

function labelFor(value: unknown) {
  return byValue.value.get(value as OptionValue)?.label ?? ''
}

function removeChip(value: OptionValue) {
  if (!Array.isArray(model.value))
    return
  model.value = model.value.filter(entry => entry !== value)
}

const sizes: Record<Size, { anchor: string, input: string, icon: string }> = {
  sm: { anchor: 'min-h-9 px-2.5 gap-1.5', input: 'h-7 text-sm', icon: 'size-4' },
  md: { anchor: 'min-h-10 px-3 gap-2', input: 'h-8 text-sm', icon: 'size-4' },
  lg: { anchor: 'min-h-12 px-3.5 gap-2', input: 'h-10 text-base', icon: 'size-5' },
}
</script>

<template>
  <ComboboxRoot
    v-model="model"
    :multiple="multiple"
    :disabled="isDisabled"
    :required="field?.required.value"
    open-on-click
    open-on-focus
    class="relative w-full"
  >
    <ComboboxAnchor
      class="flex w-full flex-wrap items-center rounded-field border bg-[var(--surface-raised)] py-1 shadow-raise
             transition-[border-color,background-color,box-shadow] duration-(--duration-snap)
             data-[disabled]:cursor-not-allowed data-[disabled]:bg-[var(--surface-sunken)] data-[disabled]:opacity-60"
      :class="[
        sizes[size].anchor,
        isInvalid
          ? 'border-[var(--color-critical)]'
          : 'border-[var(--surface-border)] hover:border-ink-300 focus-within:border-tide-500 dark:hover:border-ink-700',
      ]"
    >
      <Icon
        v-if="icon"
        :name="icon"
        :class="[sizes[size].icon, 'shrink-0 text-[var(--text-muted)]']"
        aria-hidden="true"
      />

      <span
        v-for="chip in chips"
        :key="String(chip.value)"
        class="inline-flex max-w-full items-center gap-1 rounded-pill bg-tide-100 py-0.5 ps-2 pe-1 text-xs font-medium
               text-tide-800 dark:bg-tide-900/50 dark:text-tide-100"
      >
        <span class="truncate">{{ chip.label }}</span>
        <button
          type="button"
          class="grid size-4 shrink-0 place-items-center rounded-pill transition-colors duration-(--duration-snap)
                 hover:bg-tide-200 dark:hover:bg-tide-800"
          :aria-label="`Remove ${chip.label}`"
          @click.stop="removeChip(chip.value)"
        >
          <Icon name="lucide:x" class="size-3" aria-hidden="true" />
        </button>
      </span>

      <ComboboxInput
        :id="comboId"
        :placeholder="multiple && chips.length ? '' : placeholder"
        :display-value="multiple ? undefined : labelFor"
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="field?.describedBy.value"
        class="min-w-24 flex-1 bg-transparent text-[var(--text-strong)] outline-none
               placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed"
        :class="sizes[size].input"
      />

      <ComboboxTrigger
        class="grid size-6 shrink-0 place-items-center rounded-pill text-[var(--text-muted)]
               transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        aria-label="Toggle options"
      >
        <Icon name="lucide:chevrons-up-down" class="size-4" aria-hidden="true" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="6"
        class="z-50 max-h-(--reka-combobox-content-available-height) w-(--reka-combobox-trigger-width)
               overflow-hidden rounded-card border border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-lift"
      >
        <ComboboxViewport class="max-h-64 overflow-y-auto p-1">
          <ComboboxEmpty class="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
            {{ emptyText }}
          </ComboboxEmpty>

          <ComboboxItem
            v-for="item in items"
            :key="String(item.value)"
            :value="item.value"
            :disabled="item.disabled"
            class="flex cursor-pointer select-none items-center gap-2 rounded-field px-2.5 py-2 text-sm
                   text-[var(--text-strong)] outline-none transition-colors duration-(--duration-snap)
                   data-[highlighted]:bg-tide-50 data-[highlighted]:text-tide-900
                   data-[disabled]:pointer-events-none data-[disabled]:opacity-40
                   dark:data-[highlighted]:bg-tide-900/40 dark:data-[highlighted]:text-tide-50"
          >
            <Icon
              v-if="item.icon"
              :name="item.icon"
              class="size-4 shrink-0 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            <ComboboxItemIndicator class="ms-auto inline-flex shrink-0">
              <Icon name="lucide:check" class="size-4 text-tide-600" aria-hidden="true" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
