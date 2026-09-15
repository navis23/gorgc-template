<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Recover your account' })

const toast = useToast()

const email = ref('')
const error = ref<string | undefined>()
const attempted = ref(false)
const loading = ref(false)

/** Once a link is out the door the form is replaced, not merely disabled. */
const sent = ref(false)
const sentTo = ref('')
const resendIn = ref(0)

let ticker: ReturnType<typeof setInterval> | undefined

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(): boolean {
  const value = email.value.trim()

  if (!value)
    error.value = 'Enter the address on the account.'
  else if (!EMAIL.test(value))
    error.value = 'That does not look like an email address.'
  else
    error.value = undefined

  return !error.value
}

watch(email, () => {
  if (attempted.value)
    validate()
})

onBeforeUnmount(() => {
  if (ticker)
    clearInterval(ticker)
})

function startCooldown(seconds = 45) {
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

async function onSubmit() {
  attempted.value = true

  if (!validate()) {
    document.getElementById('recover-email')?.focus()
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  loading.value = false

  sentTo.value = email.value.trim()
  sent.value = true
  startCooldown()
}

async function resend() {
  if (resendIn.value > 0)
    return
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 900))
  loading.value = false
  startCooldown()
  toast.success(`A fresh link is on its way to ${sentTo.value}.`, { title: 'Sent again' })
}

function useAnother() {
  sent.value = false
  attempted.value = false
  error.value = undefined
  email.value = ''
  // out-in transition: the field only exists again once the leave has finished.
  setTimeout(() => {
    document.getElementById('recover-email')?.focus()
  }, 450)
}
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-entrance)"
    enter-from-class="opacity-0 translate-y-3"
    leave-active-class="transition-[opacity,transform] duration-(--duration-base) ease-(--ease-exit)"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <!-- form -->
    <div v-if="!sent" key="form" class="space-y-7">
      <header class="space-y-3">
        <span class="grid size-11 place-items-center rounded-field bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200">
          <Icon name="lucide:key-round" class="size-5" aria-hidden="true" />
        </span>
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          Forgot your password?
        </h1>
        <p class="text-sm leading-relaxed text-[var(--text-muted)]">
          Give us the email on the account and we will send a single-use link.
          It expires after 30 minutes, and using it signs out every other
          session on the workspace.
        </p>
      </header>

      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <GorgFormGroup id="recover-email" label="Email" :error="error" required>
          <GorgInput
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@company.com"
            icon="lucide:mail"
            :disabled="loading"
          />
        </GorgFormGroup>

        <GorgButton type="submit" size="lg" block :loading="loading">
          {{ loading ? 'Sending the link…' : 'Send reset link' }}
        </GorgButton>
      </form>

      <p class="text-center text-sm text-[var(--text-muted)]">
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center gap-1.5 rounded-field font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          Back to sign in
        </NuxtLink>
      </p>
    </div>

    <!-- success -->
    <div v-else key="sent" class="space-y-7" role="status" aria-live="polite">
      <header class="space-y-3">
        <span class="grid size-11 place-items-center rounded-field bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]">
          <Icon name="lucide:mail-check" class="size-5" aria-hidden="true" />
        </span>
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          Check your inbox
        </h1>
        <p class="text-sm leading-relaxed text-[var(--text-muted)]">
          If an account exists for
          <strong class="font-semibold text-[var(--text-strong)]">{{ sentTo }}</strong>,
          a reset link is on its way. It usually lands within a minute.
        </p>
      </header>

      <GorgCard elevation="raise">
        <ol class="space-y-3 text-sm text-[var(--text-muted)]">
          <li class="flex gap-3">
            <span class="grid size-6 shrink-0 place-items-center rounded-pill bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--text-strong)]">1</span>
            <span class="pt-0.5">Open the message from <span class="font-medium text-[var(--text-strong)]">no-reply@gorg.app</span>.</span>
          </li>
          <li class="flex gap-3">
            <span class="grid size-6 shrink-0 place-items-center rounded-pill bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--text-strong)]">2</span>
            <span class="pt-0.5">Follow the link and pick a new password.</span>
          </li>
          <li class="flex gap-3">
            <span class="grid size-6 shrink-0 place-items-center rounded-pill bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--text-strong)]">3</span>
            <span class="pt-0.5">Nothing there? Check spam before asking for another.</span>
          </li>
        </ol>

        <template #footer>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-[var(--text-muted)]">
              {{ resendIn > 0 ? `You can resend in ${resendIn}s` : 'Ready to send another' }}
            </p>
            <GorgButton
              variant="outline"
              size="sm"
              :disabled="resendIn > 0"
              :loading="loading"
              @click="resend"
            >
              <template #lead>
                <Icon name="lucide:rotate-ccw" class="size-4" aria-hidden="true" />
              </template>
              Resend link
            </GorgButton>
          </div>
        </template>
      </GorgCard>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          class="rounded-field font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
          @click="useAnother"
        >
          Use a different email
        </button>
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center gap-1.5 rounded-field font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-strong)] hover:underline"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          Back to sign in
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>
