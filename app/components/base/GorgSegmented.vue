<script setup lang="ts">
export interface GorgSegmentedItem {
  value: string
  /** Visible text. Omit for an icon-only segment — then `ariaLabel` is required. */
  label?: string
  icon?: string
  /** Accessible name; required when there is no `label`. */
  ariaLabel?: string
  disabled?: boolean
}

type Variant = 'outline' | 'soft' | 'pill'
type Size = 'xs' | 'sm' | 'md'

const props = withDefaults(defineProps<{
  items: GorgSegmentedItem[]
  variant?: Variant
  size?: Size
  /** Share the row equally between segments. */
  grow?: boolean
  /** Names the group for screen readers, e.g. "Card density". */
  ariaLabel?: string
}>(), { variant: 'outline', size: 'sm' })

const model = defineModel<string>({ required: true })

const shells: Record<Variant, string> = {
  outline: 'rounded-field border border-[var(--surface-border)] p-0.5',
  soft: 'rounded-pill bg-[var(--surface-sunken)] p-1',
  // Same sunken shell as `soft`, but the active segment is brand-solid.
  pill: 'rounded-pill bg-[var(--surface-sunken)] p-1',
}

const segments: Record<Variant, { base: string, on: string, off: string }> = {
  outline: {
    base: 'rounded-[calc(var(--radius-field)-2px)]',
    on: 'bg-tide-600 text-white',
    off: 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]',
  },
  soft: {
    base: 'rounded-pill',
    on: 'bg-[var(--surface-raised)] text-[var(--text-strong)] shadow-raise',
    off: 'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
  },
  pill: {
    base: 'rounded-pill',
    on: 'bg-tide-600 text-white shadow-raise',
    off: 'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
  },
}

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3 text-sm gap-1.5',
}

const icons: Record<Size, string> = { xs: 'size-3', sm: 'size-3.5', md: 'size-4' }

const root = useTemplateRef<HTMLElement>('root')

const enabled = computed(() => props.items.filter(i => !i.disabled))

/**
 * Arrow keys move between segments, as a grouped control should. The hand-rolled
 * versions this replaces were click-only.
 */
function onKeydown(event: KeyboardEvent) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key))
    return

  const list = enabled.value
  if (list.length < 2)
    return

  event.preventDefault()
  const current = list.findIndex(i => i.value === model.value)
  let next = current

  if (event.key === 'Home')
    next = 0
  else if (event.key === 'End')
    next = list.length - 1
  else if (event.key === 'ArrowRight')
    next = current < 0 ? 0 : (current + 1) % list.length
  else
    next = current < 0 ? list.length - 1 : (current - 1 + list.length) % list.length

  const target = list[next]
  if (!target)
    return
  model.value = target.value

  // Keep focus on the segment the user just moved to.
  nextTick(() => {
    root.value?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(target.value)}"]`)?.focus()
  })
}
</script>

<template>
  <div
    ref="root"
    role="group"
    :aria-label="ariaLabel"
    class="inline-flex items-center gap-1"
    :class="[shells[variant], grow && 'flex w-full']"
    @keydown="onKeydown"
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :data-value="item.value"
      :disabled="item.disabled"
      :aria-pressed="model === item.value"
      :aria-label="item.ariaLabel"
      class="inline-flex items-center justify-center font-medium whitespace-nowrap
             transition-colors duration-(--duration-snap)
             disabled:cursor-not-allowed disabled:opacity-40"
      :class="[
        sizes[size],
        segments[variant].base,
        model === item.value ? segments[variant].on : segments[variant].off,
        grow && 'flex-1',
      ]"
      @click="model = item.value"
    >
      <Icon v-if="item.icon" :name="item.icon" :class="icons[size]" />
      <slot :name="item.value" :item="item">{{ item.label }}</slot>
    </button>
  </div>
</template>
