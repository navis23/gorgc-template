<script setup lang="ts">
import type { ComputedRef } from 'vue'

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
  rows?: number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  error?: boolean | string
  /** Grow the box to fit its content instead of scrolling. */
  autoResize?: boolean
  /** Ceiling for `autoResize`, in pixels. */
  maxHeight?: number
  /** Showing a counter is implied by setting this. */
  maxlength?: number
  id?: string
}>(), {
  size: 'md',
  rows: 4,
  maxHeight: 420,
})

const model = defineModel<string | undefined>()

const field = inject<FieldContext | null>('gorg-form-field', null)
const uid = useId()

const el = ref<HTMLTextAreaElement | null>(null)

const textareaId = computed(() => props.id ?? field?.id.value ?? `gorg-textarea-${uid}`)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || field?.invalid.value === true)
const isDisabled = computed(() => props.disabled === true || field?.disabled.value === true)

const counterId = computed(() => `${textareaId.value}-counter`)
const length = computed(() => (model.value ?? '').length)
const overBudget = computed(() => props.maxlength !== undefined && length.value > props.maxlength)

const describedBy = computed(() => {
  const ids = [field?.describedBy.value, props.maxlength !== undefined ? counterId.value : null].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-2',
  md: 'text-sm px-3.5 py-2.5',
  lg: 'text-base px-4 py-3',
}

function resize() {
  const node = el.value
  if (!node || !props.autoResize)
    return

  node.style.height = 'auto'
  const next = Math.min(node.scrollHeight, props.maxHeight)
  node.style.height = `${next}px`
  node.style.overflowY = node.scrollHeight > props.maxHeight ? 'auto' : 'hidden'
}

watch(model, () => nextTick(resize))

onMounted(() => {
  nextTick(resize)

  if (!props.autoResize || !import.meta.client)
    return

  // The mount measurement happens against fallback font metrics, so pre-filled
  // content is measured too short and gets clipped. Re-measure once webfonts
  // have settled.
  document.fonts?.ready.then(resize).catch(() => {})

  // Width changes re-wrap the text and therefore change the required height.
  // Only react to width — observing height would feed back into our own writes.
  let lastWidth = 0
  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0
    if (width && width !== lastWidth) {
      lastWidth = width
      resize()
    }
  })
  if (el.value)
    observer.observe(el.value)

  onBeforeUnmount(() => observer.disconnect())
})

defineExpose({ focus: () => el.value?.focus(), resize, el })
</script>

<template>
  <div class="w-full">
    <textarea
      :id="textareaId"
      ref="el"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :required="field?.required.value || undefined"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="describedBy"
      class="block w-full rounded-field border bg-[var(--surface-raised)] leading-relaxed text-[var(--text-strong)]
             placeholder:text-[var(--text-muted)] shadow-raise
             transition-[border-color,background-color,box-shadow] duration-(--duration-snap)
             read-only:bg-[var(--surface-sunken)]
             disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-60"
      :class="[
        sizes[size],
        autoResize ? 'resize-none' : 'resize-y',
        isInvalid
          ? 'border-[var(--color-critical)]'
          : 'border-[var(--surface-border)] hover:border-ink-300 focus:border-tide-500 dark:hover:border-ink-700',
      ]"
      @input="resize"
    />

    <div v-if="maxlength !== undefined" class="mt-1.5 flex justify-end">
      <span
        :id="counterId"
        class="font-mono text-xs tabular-nums"
        :class="overBudget ? 'text-[var(--color-critical)]' : 'text-[var(--text-muted)]'"
        aria-live="polite"
      >
        {{ length }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>
