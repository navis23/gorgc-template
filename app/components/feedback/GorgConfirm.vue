<script setup lang="ts">
import type { GorgConfirmTone } from '~/composables/useConfirm'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

/**
 * Mount exactly one of these, once, near the root — the same pairing as
 * `useToast()` + `<GorgToaster />`. Every `confirm()` call anywhere in the app
 * renders through this instance.
 */
const { state, accept, cancel } = useConfirm()

const uid = useId()

const typed = ref<string | number | undefined>('')
const gateRef = ref<{ focus: () => void } | null>(null)
const cancelRef = ref<HTMLButtonElement | null>(null)
const confirmRef = ref<HTMLButtonElement | null>(null)

const request = computed(() => state.value.request)
const tone = computed<GorgConfirmTone>(() => request.value?.tone ?? 'critical')
const gate = computed(() => request.value?.requireText ?? '')
const locked = computed(() => gate.value.length > 0 && String(typed.value ?? '') !== gate.value)

const gateId = computed(() => `gorg-confirm-gate-${uid}`)
const gateHintId = computed(() => `gorg-confirm-hint-${uid}`)
// Reka only mints a content id when a DialogTrigger exists; this dialog has no
// trigger, so supply one rather than shipping `id=""`.
const dialogId = computed(() => `gorg-confirm-${uid}`)

const tones: Record<GorgConfirmTone, { halo: string, action: string, icon: string }> = {
  critical: {
    halo: 'bg-[color-mix(in_oklch,var(--color-critical)_12%,transparent)] text-[var(--color-critical)]',
    action: 'bg-[var(--color-critical)] text-ink-50 hover:brightness-110 active:brightness-95',
    icon: 'lucide:triangle-alert',
  },
  caution: {
    // Caution sits high on the lightness scale, so its label goes dark.
    halo: 'bg-[color-mix(in_oklch,var(--color-caution)_18%,transparent)] text-[var(--color-caution)]',
    action: 'bg-[var(--color-caution)] text-ink-950 hover:brightness-105 active:brightness-95',
    icon: 'lucide:circle-alert',
  },
  brand: {
    halo: 'bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200',
    action: 'bg-tide-600 text-ink-50 hover:bg-tide-700 active:bg-tide-800',
    icon: 'lucide:circle-help',
  },
}

// A fresh question always starts from an empty gate.
watch(() => request.value?.id, () => { typed.value = '' })

/**
 * Focus lands on the safest thing in the dialog — never on the destructive
 * button. Critical always hands focus to Cancel; a gated confirm is disabled
 * anyway, so focus goes to the field the user has to fill.
 */
function onOpenAutoFocus(event: Event) {
  event.preventDefault()
  if (tone.value === 'critical')
    cancelRef.value?.focus()
  else if (locked.value)
    gateRef.value?.focus()
  else
    confirmRef.value?.focus()
}

// Escape and an outside click both arrive here as `false`.
function onOpenChange(value: boolean) {
  if (!value)
    cancel()
}

function onConfirm() {
  if (locked.value)
    return
  accept()
}

const actionClass = 'inline-flex h-10 items-center justify-center rounded-field px-4 text-sm font-medium '
  + 'whitespace-nowrap select-none shadow-raise transition-[background-color,filter,transform] '
  + 'duration-(--duration-snap) active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
</script>

<template>
  <DialogRoot :open="state.open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-sm" />

      <DialogContent
        :id="dialogId"
        role="alertdialog"
        class="fixed start-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2
               surface-card shadow-lift focus:outline-none"
        @open-auto-focus="onOpenAutoFocus"
      >
        <template v-if="request">
          <div class="flex gap-4 p-5">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-pill"
              :class="tones[tone].halo"
            >
              <Icon :name="request.icon ?? tones[tone].icon" class="size-5" aria-hidden="true" />
            </span>

            <div class="min-w-0 flex-1">
              <DialogTitle class="text-base font-semibold text-[var(--text-strong)]">
                {{ request.title }}
              </DialogTitle>

              <DialogDescription v-if="request.message" class="mt-1.5 text-sm text-[var(--text-muted)]">
                {{ request.message }}
              </DialogDescription>

              <div v-if="gate" class="mt-4">
                <label :for="gateId" class="block text-sm text-[var(--text-muted)]">
                  Type
                  <span class="font-mono font-semibold text-[var(--text-strong)]">{{ gate }}</span>
                  to continue
                </label>

                <GorgInput
                  :id="gateId"
                  ref="gateRef"
                  v-model="typed"
                  class="mt-2"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  :aria-describedby="gateHintId"
                  @keydown.enter.prevent="onConfirm"
                />

                <p :id="gateHintId" class="sr-only">
                  {{ request.confirmLabel }} stays disabled until the text matches exactly.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-2 border-t border-[var(--surface-border)] p-4 sm:flex-row sm:justify-end">
            <button
              ref="cancelRef"
              type="button"
              class="inline-flex h-10 items-center justify-center rounded-field border border-[var(--surface-border)]
                     px-4 text-sm font-medium text-[var(--text-strong)] transition-[background-color,border-color]
                     duration-(--duration-snap) hover:bg-[var(--surface-sunken)] dark:border-ink-700 dark:hover:border-ink-600"
              @click="cancel"
            >
              {{ request.cancelLabel }}
            </button>

            <button
              ref="confirmRef"
              type="button"
              :disabled="locked"
              :aria-describedby="gate ? gateHintId : undefined"
              :class="[actionClass, tones[tone].action]"
              @click="onConfirm"
            >
              {{ request.confirmLabel }}
            </button>
          </div>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
