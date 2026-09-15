<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, VisuallyHidden } from 'reka-ui'
import { gsap } from 'gsap'

type Side = 'left' | 'right' | 'top' | 'bottom'
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const props = withDefaults(defineProps<{
  side?: Side
  size?: Size
  title?: string
  description?: string
  modal?: boolean
  /** hide the built-in close control in the header */
  hideClose?: boolean
  /** fade + rise the body's direct children once the panel has landed */
  stagger?: boolean
}>(), {
  side: 'right',
  size: 'md',
  modal: true,
  stagger: true,
})

const open = defineModel<boolean>('open', { default: false })

const edges: Record<Side, string> = {
  left: 'inset-y-0 left-0 border-r',
  right: 'inset-y-0 right-0 border-l',
  top: 'inset-x-0 top-0 border-b',
  bottom: 'inset-x-0 bottom-0 border-t',
}

const inlineSizes: Record<Size, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[30rem]',
  xl: 'w-[38rem]',
  full: 'w-screen',
}

const blockSizes: Record<Size, string> = {
  sm: 'h-1/4',
  md: 'h-1/3',
  lg: 'h-1/2',
  xl: 'h-2/3',
  full: 'h-svh',
}

const isHorizontal = computed(() => props.side === 'left' || props.side === 'right')
const sizeClass = computed(() => (isHorizontal.value ? inlineSizes[props.size] : blockSizes[props.size]))

const from: Record<Side, { xPercent?: number, yPercent?: number }> = {
  left: { xPercent: -100 },
  right: { xPercent: 100 },
  top: { yPercent: -100 },
  bottom: { yPercent: 100 },
}

function fadeIn(el: Element, done: () => void) {
  gsap.fromTo(el as HTMLElement, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out', onComplete: done })
}

function fadeOut(el: Element, done: () => void) {
  gsap.to(el as HTMLElement, { opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: done })
}

function slideIn(el: Element, done: () => void) {
  const node = el as HTMLElement
  gsap.fromTo(node,
    { ...from[props.side], opacity: 0.4 },
    {
      xPercent: 0,
      yPercent: 0,
      opacity: 1,
      duration: 0.42,
      ease: 'power3.out',
      onComplete: () => {
        gsap.set(node, { clearProps: 'transform,opacity' })
        if (props.stagger) {
          const rows = node.querySelectorAll('[data-gorg-drawer-body] > *')
          if (rows.length) {
            gsap.from(rows, {
              opacity: 0,
              y: 12,
              duration: 0.34,
              stagger: 0.05,
              ease: 'power3.out',
              clearProps: 'opacity,transform',
            })
          }
        }
        done()
      },
    },
  )
}

function slideOut(el: Element, done: () => void) {
  gsap.to(el as HTMLElement, {
    ...from[props.side],
    opacity: 0.4,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: done,
  })
}
</script>

<template>
  <DialogRoot v-model:open="open" :modal="modal">
    <slot name="trigger" />

    <DialogPortal force-mount>
      <Transition :css="false" @enter="fadeIn" @leave="fadeOut">
        <DialogOverlay
          v-if="open"
          force-mount
          class="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px]"
        />
      </Transition>

      <Transition :css="false" @enter="slideIn" @leave="slideOut">
        <DialogContent
          v-if="open"
          force-mount
          class="fixed z-50 flex max-h-svh flex-col border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-lift focus-visible:outline-none"
          :class="[edges[side], sizeClass]"
        >
          <header class="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--surface-border)] px-4">
            <div class="min-w-0 flex-1">
              <DialogTitle v-if="title" class="truncate text-sm font-semibold text-[var(--text-strong)]">
                {{ title }}
              </DialogTitle>
              <VisuallyHidden v-else>
                <DialogTitle>Panel</DialogTitle>
              </VisuallyHidden>

              <DialogDescription v-if="description" class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {{ description }}
              </DialogDescription>
            </div>

            <slot name="header" />

            <DialogClose
              v-if="!hideClose"
              aria-label="Close panel"
              class="grid size-9 shrink-0 place-items-center rounded-field text-[var(--text-muted)]
                     transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <Icon name="lucide:x" class="size-5" />
            </DialogClose>
          </header>

          <div data-gorg-drawer-body class="min-h-0 flex-1 overflow-y-auto p-4">
            <slot />
          </div>

          <div v-if="$slots.footer" class="shrink-0 border-t border-[var(--surface-border)] p-4">
            <slot name="footer" />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
