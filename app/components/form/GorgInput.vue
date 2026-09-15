<script setup lang="ts">
import type { ComputedRef, InputHTMLAttributes } from 'vue'

interface FieldContext {
  id: ComputedRef<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
}

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  type?: InputHTMLAttributes['type']
  size?: Size
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** `true` for a plain invalid state, or a string that also labels the control. */
  error?: boolean | string
  /** Leading icon name, e.g. `lucide:search`. */
  icon?: string
  clearable?: boolean
  loading?: boolean
  id?: string
}>(), {
  type: 'text',
  size: 'md',
})

const emit = defineEmits<{
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// Attributes written on <GorgInput> must reach the real <input> — autocomplete,
// name, inputmode, pattern and friends are inert on a wrapper <div>, and browsers
// read autofill hints off the live input. `class`/`style` still belong to the
// wrapper, since callers use them to size the field in a layout.
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const model = defineModel<string | number | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()
const slots = useSlots()

const inputEl = ref<HTMLInputElement | null>(null)

const inputId = computed(() => props.id ?? field?.id.value ?? `gorg-input-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const hasLead = computed(() => Boolean(props.icon) || Boolean(slots.leading))
const showClear = computed(() =>
  props.clearable
  && !props.loading
  && !isDisabled.value
  && !props.readonly
  && model.value !== undefined
  && model.value !== null
  && String(model.value).length > 0,
)
const hasTrail = computed(() => props.loading === true || showClear.value || Boolean(slots.trailing))

const sizes: Record<Size, { field: string, pad: string, lead: string, trail: string, box: string, icon: string }> = {
  sm: { field: 'h-9 text-sm', pad: 'px-3', lead: 'ps-9', trail: 'pe-9', box: 'w-9', icon: 'size-4' },
  md: { field: 'h-10 text-sm', pad: 'px-3.5', lead: 'ps-10', trail: 'pe-10', box: 'w-10', icon: 'size-4' },
  lg: { field: 'h-12 text-base', pad: 'px-4', lead: 'ps-12', trail: 'pe-12', box: 'w-12', icon: 'size-5' },
}

function clear() {
  model.value = typeof model.value === 'number' ? undefined : ''
  emit('clear')
  inputEl.value?.focus()
}

defineExpose({ focus: () => inputEl.value?.focus(), el: inputEl })
</script>

<template>
  <div class="relative w-full" v-bind="wrapperAttrs">
    <div
      v-if="hasLead"
      class="pointer-events-none absolute inset-y-0 start-0 z-1 flex items-center justify-center text-[var(--text-muted)]"
      :class="sizes[size].box"
    >
      <slot name="leading">
        <Icon v-if="icon" :name="icon" :class="sizes[size].icon" aria-hidden="true" />
      </slot>
    </div>

    <input
      v-bind="inputAttrs"
      :id="inputId"
      ref="inputEl"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :readonly="readonly"
      :required="field?.required.value || undefined"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="field?.describedBy.value"
      :aria-busy="loading || undefined"
      class="w-full appearance-none rounded-field border bg-[var(--surface-raised)] text-[var(--text-strong)]
             placeholder:text-[var(--text-muted)] shadow-raise
             transition-[border-color,background-color,box-shadow] duration-(--duration-snap)
             read-only:bg-[var(--surface-sunken)]
             disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-60"
      :class="[
        sizes[size].field,
        sizes[size].pad,
        hasLead && sizes[size].lead,
        hasTrail && sizes[size].trail,
        isInvalid
          ? 'border-[var(--color-critical)] hover:border-[var(--color-critical)]'
          : 'border-[var(--surface-border)] hover:border-ink-300 focus:border-tide-500 dark:hover:border-ink-700',
      ]"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >

    <div
      v-if="hasTrail"
      class="absolute inset-y-0 end-0 z-1 flex items-center gap-1 pe-2 text-[var(--text-muted)]"
    >
      <slot name="trailing" />

      <Icon
        v-if="loading"
        name="lucide:loader-circle"
        class="size-4 animate-spin"
        aria-hidden="true"
      />

      <button
        v-else-if="showClear"
        type="button"
        class="grid size-6 place-items-center rounded-pill transition-colors duration-(--duration-snap)
               hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        :aria-label="`Clear ${placeholder || 'field'}`"
        @click="clear"
      >
        <Icon name="lucide:x" class="size-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
