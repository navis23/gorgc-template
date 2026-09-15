<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Message text. Ignored when the default slot is used. */
  message?: string
  /** Force visibility — otherwise the message itself decides. */
  show?: boolean
  id?: string
  icon?: string
}>(), {
  icon: 'lucide:circle-alert',
})

const slots = useSlots()

const visible = computed(() => {
  if (props.show === false)
    return false
  return props.show === true || Boolean(props.message) || Boolean(slots.default)
})
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,transform] duration-(--duration-base) ease-(--ease-entrance)"
    enter-from-class="opacity-0 -translate-y-1"
    leave-active-class="transition-[opacity,transform] duration-(--duration-snap) ease-(--ease-exit)"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <p
      v-if="visible"
      :id="id"
      role="alert"
      aria-live="polite"
      class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-[var(--color-critical)]"
    >
      <Icon :name="icon" class="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span class="min-w-0 leading-relaxed">
        <slot>{{ message }}</slot>
      </span>
    </p>
  </Transition>
</template>
