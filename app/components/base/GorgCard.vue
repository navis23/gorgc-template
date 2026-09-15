<script setup lang="ts">
withDefaults(defineProps<{
  elevation?: 'flat' | 'raise' | 'float' | 'lift'
  padded?: boolean
  interactive?: boolean
}>(), {
  elevation: 'raise',
  padded: true,
})

const shadows = {
  flat: '',
  raise: 'shadow-raise',
  float: 'shadow-float',
  lift: 'shadow-lift',
}
</script>

<template>
  <div
    class="surface-card transition-[box-shadow,transform] duration-(--duration-base)"
    :class="[
      shadows[elevation],
      padded && 'p-5',
      interactive && 'hover:shadow-float hover:-translate-y-0.5 cursor-pointer',
    ]"
  >
    <header v-if="$slots.header || $slots.title" class="mb-4 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h3 v-if="$slots.title" class="truncate text-sm font-semibold text-[var(--text-strong)]">
          <slot name="title" />
        </h3>
        <p v-if="$slots.subtitle" class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
          <slot name="subtitle" />
        </p>
      </div>
      <slot name="header" />
    </header>

    <slot />

    <footer v-if="$slots.footer" class="mt-4 border-t border-[var(--surface-border)] pt-4">
      <slot name="footer" />
    </footer>
  </div>
</template>
