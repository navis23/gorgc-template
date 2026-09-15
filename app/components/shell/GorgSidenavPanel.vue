<script setup lang="ts">
import { gsap } from 'gsap'
import { staggerNav } from './shell'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  open?: boolean
  width?: 'sm' | 'md' | 'lg'
}>(), {
  open: true,
  width: 'md',
})

const widths = {
  sm: 'w-52',
  md: 'w-64',
  lg: 'w-72',
} as const

const body = ref<HTMLElement | null>(null)

watch(() => props.open, async (value) => {
  if (!value)
    return
  await nextTick()
  staggerNav(body.value, -10)
})

onMounted(() => {
  if (props.open)
    staggerNav(body.value, -10)
})

function onEnter(el: Element, done: () => void) {
  const node = el as HTMLElement
  const target = node.offsetWidth
  gsap.fromTo(node,
    { width: 0, opacity: 0 },
    {
      width: target,
      opacity: 1,
      duration: 0.32,
      ease: 'power3.out',
      onComplete: () => {
        gsap.set(node, { clearProps: 'width,opacity' })
        done()
      },
    },
  )
}

function onLeave(el: Element, done: () => void) {
  gsap.to(el as HTMLElement, {
    width: 0,
    opacity: 0,
    duration: 0.22,
    ease: 'power2.in',
    onComplete: done,
  })
}
</script>

<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div
      v-if="open"
      class="flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--surface-border)] bg-[var(--surface-raised)]"
      :class="widths[width]"
    >
      <header
        v-if="title || $slots.header"
        class="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[var(--surface-border)] px-4"
      >
        <div class="min-w-0">
          <h2 v-if="title" class="truncate text-sm font-semibold text-[var(--text-strong)]">
            {{ title }}
          </h2>
          <p v-if="subtitle" class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
            {{ subtitle }}
          </p>
        </div>
        <slot name="header" />
      </header>

      <div ref="body" class="flex-1 overflow-y-auto px-3 py-4">
        <slot />
      </div>

      <div v-if="$slots.footer" class="shrink-0 border-t border-[var(--surface-border)] p-3">
        <slot name="footer" />
      </div>
    </div>
  </Transition>
</template>
