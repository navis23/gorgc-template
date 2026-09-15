<script setup lang="ts">
import type { ComputedRef } from 'vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
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
  /** Swaps in a filterable combobox for long lists. */
  searchable?: boolean
  icon?: string
  id?: string
}>(), {
  items: () => [],
  placeholder: 'Select an option',
  size: 'md',
  searchable: false,
})

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

/**
 * Tailwind resolves by stylesheet order, not attribute order, so a caller's
 * `class="w-40"` loses to our own `w-full` (same specificity, `w-full` emitted
 * later). Drop ours whenever the caller sets a width themselves — responsive
 * prefixes included.
 */
const callerSetsWidth = computed(() =>
  /(?:^|\s)(?:[a-z0-9-]+:)*(?:w|min-w|max-w)-/.test(String(attrs.class ?? '')))

const model = defineModel<OptionValue | null | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const selectId = computed(() => props.id ?? field?.id.value ?? `gorg-select-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const selected = computed(() => props.items.find(item => item.value === model.value))

const sizes: Record<Size, { trigger: string, icon: string }> = {
  sm: { trigger: 'h-9 px-3 text-sm gap-2', icon: 'size-4' },
  md: { trigger: 'h-10 px-3.5 text-sm gap-2', icon: 'size-4' },
  lg: { trigger: 'h-12 px-4 text-base gap-2.5', icon: 'size-5' },
}
</script>

<template>
  <GorgCombobox
    v-if="searchable"
    v-model="model"
    :items="items"
    :placeholder="placeholder"
    :size="size"
    :error="error"
    :disabled="disabled"
    :icon="icon"
    :id="id"
    v-bind="$attrs"
  />

  <SelectRoot
    v-else
    v-model="model"
    :disabled="isDisabled"
    :required="field?.required.value"
  >
    <SelectTrigger
      v-bind="$attrs"
      :id="selectId"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="field?.describedBy.value"
      class="inline-flex items-center rounded-field border bg-[var(--surface-raised)] text-start shadow-raise
             transition-[border-color,background-color,box-shadow] duration-(--duration-snap)
             data-[disabled]:cursor-not-allowed data-[disabled]:bg-[var(--surface-sunken)] data-[disabled]:opacity-60"
      :class="[
        callerSetsWidth ? '' : 'w-full',
        sizes[size].trigger,
        isInvalid
          ? 'border-[var(--color-critical)]'
          : 'border-[var(--surface-border)] hover:border-ink-300 data-[state=open]:border-tide-500 dark:hover:border-ink-700',
      ]"
    >
      <Icon
        v-if="selected?.icon || icon"
        :name="(selected?.icon || icon) as string"
        :class="[sizes[size].icon, 'shrink-0 text-[var(--text-muted)]']"
        aria-hidden="true"
      />

      <SelectValue
        :placeholder="placeholder"
        class="min-w-0 flex-1 truncate text-[var(--text-strong)] data-[placeholder]:text-[var(--text-muted)]"
      />

      <SelectIcon as-child>
        <Icon
          name="lucide:chevron-down"
          class="size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-(--duration-snap)"
          aria-hidden="true"
        />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="z-50 max-h-(--reka-select-content-available-height) w-(--reka-select-trigger-width)
               overflow-hidden rounded-card border border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-lift"
      >
        <SelectViewport class="max-h-64 overflow-y-auto p-1">
          <p v-if="!items.length" class="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
            <slot name="empty">Nothing to choose from</slot>
          </p>

          <SelectItem
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
            <SelectItemText class="min-w-0 flex-1 truncate">
              {{ item.label }}
            </SelectItemText>
            <SelectItemIndicator class="ms-auto inline-flex shrink-0">
              <Icon name="lucide:check" class="size-4 text-tide-600" aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
