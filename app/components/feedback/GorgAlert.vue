<script setup lang="ts">
type Tone = 'info' | 'positive' | 'caution' | 'critical'

const props = withDefaults(defineProps<{
  tone?: Tone
  title?: string
  dismissible?: boolean
  icon?: string
}>(), { tone: 'info' })

const emit = defineEmits<{ dismiss: [] }>()

const open = ref(true)
const root = useTemplateRef<HTMLElement>('root')

const defaultIcons: Record<Tone, string> = {
  info: 'lucide:info',
  positive: 'lucide:circle-check',
  caution: 'lucide:triangle-alert',
  critical: 'lucide:circle-x',
}

const tones: Record<Tone, string> = {
  info: 'border-[color-mix(in_oklch,var(--color-info)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-info)_10%,transparent)] text-[var(--color-info)]',
  positive: 'border-[color-mix(in_oklch,var(--color-positive)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-positive)_10%,transparent)] text-[var(--color-positive)]',
  caution: 'border-[color-mix(in_oklch,var(--color-caution)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-caution)_12%,transparent)] text-[var(--color-caution)]',
  critical: 'border-[color-mix(in_oklch,var(--color-critical)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-critical)_10%,transparent)] text-[var(--color-critical)]',
}

function dismiss() {
  open.value = false
  emit('dismiss')
}

useReveal(root, { y: 8, duration: 0.35 })
</script>

<template>
  <div
    v-if="open"
    ref="root"
    role="alert"
    class="js-reveal flex gap-3 rounded-card border p-4"
    :class="tones[props.tone]"
  >
    <Icon :name="icon ?? defaultIcons[props.tone]" class="mt-0.5 size-5 shrink-0" />

    <div class="min-w-0 flex-1">
      <p v-if="title" class="text-sm font-semibold">
        {{ title }}
      </p>
      <div class="text-sm text-[var(--text-strong)]" :class="title && 'mt-1'">
        <slot />
      </div>
      <div v-if="$slots.actions" class="mt-3 flex gap-2">
        <slot name="actions" />
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="-m-1 size-7 shrink-0 self-start rounded-field opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10 inline-flex items-center justify-center"
      aria-label="Dismiss"
      @click="dismiss"
    >
      <Icon name="lucide:x" class="size-4" />
    </button>
  </div>
</template>
