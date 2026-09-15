<script setup lang="ts">
import { gsap } from 'gsap'

withDefaults(defineProps<{
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
}>(), { position: 'bottom-right' })

const { toasts, dismiss } = useToast()

const places = {
  'top-right': 'top-4 end-4 items-end',
  'top-center': 'top-4 start-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 end-4 items-end',
  'bottom-center': 'bottom-4 start-1/2 -translate-x-1/2 items-center',
}

const tones = {
  info: 'text-[var(--color-info)]',
  positive: 'text-[var(--color-positive)]',
  caution: 'text-[var(--color-caution)]',
  critical: 'text-[var(--color-critical)]',
}

const icons = {
  info: 'lucide:info',
  positive: 'lucide:circle-check',
  caution: 'lucide:triangle-alert',
  critical: 'lucide:circle-x',
}

function onEnter(el: Element, done: () => void) {
  gsap.fromTo(el, { opacity: 0, y: 16, scale: 0.97 }, {
    opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.6)', onComplete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  gsap.to(el, { opacity: 0, x: 24, scale: 0.97, duration: 0.22, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      :class="places[position]"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup :css="false" @enter="onEnter" @leave="onLeave">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex w-full gap-3 surface-card p-3.5 shadow-float"
        >
          <Icon :name="icons[t.tone]" class="mt-0.5 size-5 shrink-0" :class="tones[t.tone]" />
          <div class="min-w-0 flex-1">
            <p v-if="t.title" class="text-sm font-semibold text-[var(--text-strong)]">{{ t.title }}</p>
            <p class="text-sm text-[var(--text-muted)]" :class="t.title && 'mt-0.5'">{{ t.message }}</p>
          </div>
          <button
            type="button"
            class="-m-1 inline-flex size-7 shrink-0 items-center justify-center self-start rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)]"
            aria-label="Dismiss notification"
            @click="dismiss(t.id)"
          >
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
