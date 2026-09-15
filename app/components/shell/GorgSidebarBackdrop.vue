<script setup lang="ts">
import { gsap } from 'gsap'

withDefaults(defineProps<{
  /** keep the backdrop at every breakpoint instead of only below `lg` */
  persistent?: boolean
}>(), {
  persistent: false,
})

const open = defineModel<boolean>({ default: false })

function onEnter(el: Element, done: () => void) {
  gsap.fromTo(el as HTMLElement, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out', onComplete: done })
}

function onLeave(el: Element, done: () => void) {
  gsap.to(el as HTMLElement, { opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div
      v-if="open"
      role="presentation"
      aria-hidden="true"
      class="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-[2px]"
      :class="!persistent && 'lg:hidden'"
      @click="open = false"
    />
  </Transition>
</template>
