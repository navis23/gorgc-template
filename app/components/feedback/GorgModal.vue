<script setup lang="ts">
import {
  DialogClose, DialogContent, DialogDescription, DialogOverlay,
  DialogPortal, DialogRoot, DialogTitle, DialogTrigger,
} from 'reka-ui'

withDefaults(defineProps<{
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  dismissible?: boolean
}>(), { size: 'md', dismissible: true })

const open = defineModel<boolean>('open', { default: false })

const sizes = {
  sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl',
  xl: 'max-w-4xl', full: 'max-w-[calc(100vw-2rem)]',
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm
               data-[state=open]:fade-in
               data-[state=closed]:fade-out"
      />

      <DialogContent
        :class="sizes[size]"
        class="fixed start-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2
               surface-card shadow-lift focus:outline-none
               data-[state=open]:pop-in
               data-[state=closed]:pop-out"
        @escape-key-down="!dismissible && $event.preventDefault()"
        @pointer-down-outside="!dismissible && $event.preventDefault()"
      >
        <div v-if="title || $slots.header" class="flex items-start justify-between gap-4 border-b border-[var(--surface-border)] p-5">
          <div class="min-w-0">
            <DialogTitle v-if="title" class="text-base font-semibold text-[var(--text-strong)]">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-sm text-[var(--text-muted)]">
              {{ description }}
            </DialogDescription>
            <slot name="header" />
          </div>

          <DialogClose
            v-if="dismissible"
            class="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            aria-label="Close"
          >
            <Icon name="lucide:x" class="size-4" />
          </DialogClose>
        </div>

        <div class="p-5">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-[var(--surface-border)] p-5">
          <slot name="footer" :close="() => (open = false)" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
