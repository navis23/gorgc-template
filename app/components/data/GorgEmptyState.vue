<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  icon?: string
  title?: string
  description?: string
  size?: Size
  /** Draw a dashed outline around the state so it reads as a placeholder. */
  bordered?: boolean
}>(), {
  icon: 'lucide:inbox',
  size: 'md',
})

const sizes: Record<Size, { wrap: string, badge: string, icon: string, title: string, copy: string }> = {
  sm: { wrap: 'px-4 py-8 gap-2', badge: 'size-10', icon: 'size-5', title: 'text-sm', copy: 'text-xs' },
  md: { wrap: 'px-6 py-12 gap-3', badge: 'size-14', icon: 'size-6', title: 'text-base', copy: 'text-sm' },
  lg: { wrap: 'px-8 py-16 gap-4', badge: 'size-20', icon: 'size-9', title: 'text-lg', copy: 'text-sm' },
}
</script>

<template>
  <div
    class="flex w-full flex-col items-center justify-center text-center"
    :class="[
      sizes[size].wrap,
      bordered && 'rounded-card border border-dashed border-[var(--surface-border)] bg-[var(--surface-raised)]',
    ]"
  >
    <span
      class="grid shrink-0 place-items-center rounded-pill bg-[var(--surface-sunken)] text-[var(--text-muted)]"
      :class="sizes[size].badge"
    >
      <slot name="icon">
        <Icon :name="icon" :class="sizes[size].icon" aria-hidden="true" />
      </slot>
    </span>

    <p v-if="title || $slots.title" class="font-semibold text-[var(--text-strong)]" :class="sizes[size].title">
      <slot name="title">{{ title }}</slot>
    </p>

    <p
      v-if="description || $slots.description"
      class="max-w-prose leading-relaxed text-balance text-[var(--text-muted)]"
      :class="sizes[size].copy"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.action" class="mt-1 flex flex-wrap items-center justify-center gap-2">
      <slot name="action" />
    </div>

    <slot />
  </div>
</template>
