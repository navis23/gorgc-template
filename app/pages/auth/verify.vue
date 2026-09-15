<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Verify your device' })

const toast = useToast()

const LENGTH = 6
/** The one code this demo accepts — everything else fails the check. */
const EXPECTED = '123456'

const address = 'amara.osei@meridian.co'

const digits = ref<string[]>(Array.from({ length: LENGTH }, () => ''))
const boxes = ref<(HTMLInputElement | null)[]>(Array.from({ length: LENGTH }, () => null))
const groupEl = useTemplateRef<HTMLElement>('groupEl')

const loading = ref(false)
const verified = ref(false)
const error = ref<string | undefined>()

const code = computed(() => digits.value.join(''))
const complete = computed(() => code.value.length === LENGTH)

/** a•••••i@meridian.co — enough to recognise, not enough to harvest. */
const masked = computed(() => {
  const [local = '', domain = ''] = address.split('@')
  if (local.length <= 2)
    return address
  return `${local[0]}${'•'.repeat(Math.max(3, local.length - 2))}${local.at(-1)}@${domain}`
})

function setBox(el: Element | ComponentPublicInstance | null, index: number) {
  boxes.value[index] = (el as HTMLInputElement | null) ?? null
}

function focusBox(index: number, select = true) {
  const el = boxes.value[Math.min(LENGTH - 1, Math.max(0, index))]
  el?.focus()
  if (select)
    el?.select()
}

function clearError() {
  error.value = undefined
}

function onInput(event: Event, index: number) {
  const el = event.target as HTMLInputElement
  const typed = el.value.replace(/\D/g, '')

  clearError()

  if (!typed) {
    digits.value[index] = ''
    el.value = ''
    return
  }

  // A keystroke gives one character; an autofilled OTP can arrive whole.
  if (typed.length > 1) {
    fill(typed, index)
    return
  }

  digits.value[index] = typed
  el.value = typed

  if (index < LENGTH - 1)
    focusBox(index + 1)

  maybeSubmit()
}

function onKeydown(event: KeyboardEvent, index: number) {
  switch (event.key) {
    case 'Backspace': {
      event.preventDefault()
      clearError()
      if (digits.value[index]) {
        digits.value[index] = ''
        syncBox(index)
      }
      else if (index > 0) {
        digits.value[index - 1] = ''
        syncBox(index - 1)
        focusBox(index - 1)
      }
      break
    }
    case 'Delete': {
      event.preventDefault()
      clearError()
      digits.value[index] = ''
      syncBox(index)
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      focusBox(index - 1)
      break
    }
    case 'ArrowRight': {
      event.preventDefault()
      focusBox(index + 1)
      break
    }
    case 'Home': {
      event.preventDefault()
      focusBox(0)
      break
    }
    case 'End': {
      event.preventDefault()
      focusBox(LENGTH - 1)
      break
    }
  }
}

function onPaste(event: ClipboardEvent, index: number) {
  const text = event.clipboardData?.getData('text') ?? ''
  const numeric = text.replace(/\D/g, '')
  if (!numeric)
    return
  event.preventDefault()
  // A full-length paste always starts at the beginning, wherever it landed.
  fill(numeric, numeric.length >= LENGTH ? 0 : index)
}

function fill(value: string, from: number) {
  clearError()
  const chars = value.replace(/\D/g, '').slice(0, LENGTH - from).split('')
  chars.forEach((char, offset) => {
    digits.value[from + offset] = char
  })
  nextTick(() => {
    for (let i = 0; i < LENGTH; i++)
      syncBox(i)
    focusBox(Math.min(LENGTH - 1, from + chars.length))
    maybeSubmit()
  })
}

/** The inputs are uncontrolled on purpose — push state back into them. */
function syncBox(index: number) {
  const el = boxes.value[index]
  if (el)
    el.value = digits.value[index] ?? ''
}

function reset(focus = true) {
  digits.value = Array.from({ length: LENGTH }, () => '')
  for (let i = 0; i < LENGTH; i++)
    syncBox(i)
  if (focus)
    focusBox(0)
}

function maybeSubmit() {
  if (complete.value && !loading.value && !verified.value)
    verify()
}

async function verify() {
  if (!complete.value) {
    error.value = 'Enter all six digits.'
    focusBox(digits.value.findIndex(d => !d))
    return
  }

  loading.value = true
  error.value = undefined
  await new Promise(resolve => setTimeout(resolve, 1200))
  loading.value = false

  if (code.value !== EXPECTED) {
    error.value = 'That code is not right, or it has already expired.'
    if (groupEl.value) {
      gsap.fromTo(groupEl.value,
        { x: -8 },
        { x: 0, duration: 0.55, ease: 'elastic.out(1.1, 0.35)' },
      )
    }
    reset()
    return
  }

  verified.value = true
  toast.success('This device is trusted for the next 30 days.', { title: 'Code accepted' })
}

/* ---- resend countdown ------------------------------------------------- */

const resendIn = ref(30)
let ticker: ReturnType<typeof setInterval> | undefined

function startCooldown(seconds = 30) {
  resendIn.value = seconds
  if (ticker)
    clearInterval(ticker)
  ticker = setInterval(() => {
    resendIn.value -= 1
    if (resendIn.value <= 0 && ticker) {
      clearInterval(ticker)
      ticker = undefined
    }
  }, 1000)
}

function resend() {
  if (resendIn.value > 0 || loading.value)
    return
  startCooldown()
  reset()
  toast.info(`A new code is on its way to ${masked.value}.`, { title: 'Code resent' })
}

onMounted(() => {
  startCooldown()
  focusBox(0, false)
})

onBeforeUnmount(() => {
  if (ticker)
    clearInterval(ticker)
})
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-entrance)"
    enter-from-class="opacity-0 translate-y-3"
    leave-active-class="transition-[opacity,transform] duration-(--duration-base) ease-(--ease-exit)"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div v-if="!verified" key="challenge" class="space-y-7">
      <header class="space-y-3">
        <span class="grid size-11 place-items-center rounded-field bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200">
          <Icon name="lucide:shield-check" class="size-5" aria-hidden="true" />
        </span>
        <h1 id="otp-heading" class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          Enter your six-digit code
        </h1>
        <p class="text-sm leading-relaxed text-[var(--text-muted)]">
          We sent it to <strong class="font-semibold text-[var(--text-strong)]">{{ masked }}</strong>.
          Paste the whole code anywhere in the row and it will spread itself out.
        </p>
      </header>

      <form class="space-y-5" novalidate @submit.prevent="verify">
        <div
          ref="groupEl"
          role="group"
          aria-labelledby="otp-heading"
          :aria-describedby="error ? 'otp-error' : 'otp-hint'"
          class="flex items-center justify-between gap-2 sm:gap-3"
        >
          <input
            v-for="(digit, index) in digits"
            :key="index"
            :ref="el => setBox(el, index)"
            type="text"
            :autocomplete="index === 0 ? 'one-time-code' : undefined"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            :value="digit"
            :disabled="loading"
            :aria-label="`Digit ${index + 1} of ${LENGTH}`"
            :aria-invalid="error ? true : undefined"
            class="h-14 w-full min-w-0 rounded-field border bg-[var(--surface-raised)] text-center font-mono text-xl font-semibold text-[var(--text-strong)] shadow-raise transition-[border-color,box-shadow,background-color] duration-(--duration-snap) disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:text-2xl"
            :class="error
              ? 'border-[var(--color-critical)]'
              : 'border-[var(--surface-border)] hover:border-ink-300 focus:border-tide-500 dark:hover:border-ink-700'"
            @input="onInput($event, index)"
            @keydown="onKeydown($event, index)"
            @paste="onPaste($event, index)"
            @focus="($event.target as HTMLInputElement).select()"
          >
        </div>

        <GorgFieldError id="otp-error" :message="error" :show="Boolean(error)" />

        <p v-if="!error" id="otp-hint" class="text-xs text-[var(--text-muted)]">
          Arrow keys move between boxes; backspace steps back. The demo code is
          <span class="font-mono font-semibold text-[var(--text-strong)]">123456</span>.
        </p>

        <GorgButton type="submit" size="lg" block :loading="loading" :disabled="!complete && !loading">
          {{ loading ? 'Checking the code…' : 'Verify and continue' }}
        </GorgButton>
      </form>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--surface-border)] pt-5 text-sm">
        <p class="text-[var(--text-muted)]" aria-live="polite">
          {{ resendIn > 0 ? `Resend available in ${resendIn}s` : 'Did not get a code?' }}
        </p>
        <button
          type="button"
          class="rounded-field font-medium text-tide-700 underline-offset-4 transition-colors duration-(--duration-snap) hover:underline disabled:pointer-events-none disabled:opacity-50 dark:text-tide-300"
          :disabled="resendIn > 0 || loading"
          @click="resend"
        >
          Send a new code
        </button>
      </div>

      <p class="text-center text-sm">
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center gap-1.5 rounded-field font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-strong)] hover:underline"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          Back to sign in
        </NuxtLink>
      </p>
    </div>

    <div v-else key="verified" class="space-y-7" role="status" aria-live="polite">
      <header class="space-y-3">
        <span class="grid size-11 place-items-center rounded-field bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]">
          <Icon name="lucide:badge-check" class="size-5" aria-hidden="true" />
        </span>
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          Device verified
        </h1>
        <p class="text-sm leading-relaxed text-[var(--text-muted)]">
          We will not ask again on this browser for 30 days. Revoke it any time
          from Settings → Security.
        </p>
      </header>

      <GorgButton to="/wizard" size="lg" block>
        <template #trail>
          <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
        </template>
        Finish setting up
      </GorgButton>

      <p class="text-center text-sm">
        <NuxtLink
          to="/"
          class="rounded-field font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-strong)] hover:underline"
        >
          Skip to the dashboard
        </NuxtLink>
      </p>
    </div>
  </Transition>
</template>
