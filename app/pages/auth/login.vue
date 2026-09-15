<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in' })

const toast = useToast()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const errors = reactive<{ email?: string, password?: string }>({})
const attempted = ref(false)
const loading = ref(false)
const reveal = ref(false)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(): boolean {
  const email = form.email.trim()

  if (!email)
    errors.email = 'Enter the email you signed up with.'
  else if (!EMAIL.test(email))
    errors.email = 'That does not look like an email address.'
  else
    errors.email = undefined

  if (!form.password)
    errors.password = 'Enter your password.'
  else if (form.password.length < 8)
    errors.password = 'Passwords are at least 8 characters.'
  else
    errors.password = undefined

  return !errors.email && !errors.password
}

// Nag only after the first attempt, then correct in real time.
watch(form, () => {
  if (attempted.value)
    validate()
})

async function onSubmit() {
  attempted.value = true

  if (!validate()) {
    document.getElementById(errors.email ? 'login-email' : 'login-password')?.focus()
    return
  }

  loading.value = true
  // No backend behind this kit — stand in for the round trip.
  await new Promise(resolve => setTimeout(resolve, 1200))
  loading.value = false

  toast.success(`Signed in as ${form.email.trim()}.`, {
    title: form.remember ? 'Welcome back — session remembered' : 'Welcome back',
  })
}

function onSocial(provider: string) {
  toast.info(`${provider} is not wired up in this demo.`, { title: 'Nothing to redirect to' })
}
</script>

<template>
  <div class="space-y-7">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
        Sign in to gorg
      </h1>
      <p class="text-sm text-[var(--text-muted)]">
        No account yet?
        <NuxtLink
          to="/auth/signup"
          class="rounded-field font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
        >
          Create one in a minute
        </NuxtLink>
      </p>
    </header>

    <div class="grid gap-2 sm:grid-cols-2">
      <GorgButton variant="outline" block :disabled="loading" @click="onSocial('GitHub')">
        <template #lead>
          <Icon name="ph:github-logo-bold" class="size-4" aria-hidden="true" />
        </template>
        GitHub
      </GorgButton>
      <GorgButton variant="outline" block :disabled="loading" @click="onSocial('Google')">
        <template #lead>
          <Icon name="ph:google-logo-bold" class="size-4" aria-hidden="true" />
        </template>
        Google
      </GorgButton>
    </div>

    <div class="flex items-center gap-3" aria-hidden="true">
      <span class="h-px flex-1 bg-[var(--surface-border)]" />
      <span class="text-[0.6875rem] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
        or with email
      </span>
      <span class="h-px flex-1 bg-[var(--surface-border)]" />
    </div>

    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <GorgFormGroup id="login-email" label="Email" :error="errors.email" required>
        <GorgInput
          v-model="form.email"
          type="email"
          name="email"
          autocomplete="username"
          placeholder="you@company.com"
          icon="lucide:mail"
          :disabled="loading"
        />
      </GorgFormGroup>

      <GorgFormGroup id="login-password" label="Password" :error="errors.password" required>
        <GorgInput
          v-model="form.password"
          :type="reveal ? 'text' : 'password'"
          name="password"
          autocomplete="current-password"
          placeholder="Your password"
          icon="lucide:lock"
          :disabled="loading"
        >
          <template #trailing>
            <button
              type="button"
              class="grid size-7 place-items-center rounded-pill transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
              :aria-label="reveal ? 'Hide password' : 'Show password'"
              :aria-pressed="reveal"
              @click="reveal = !reveal"
            >
              <Icon :name="reveal ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" aria-hidden="true" />
            </button>
          </template>
        </GorgInput>
      </GorgFormGroup>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <GorgSwitch v-model="form.remember" label="Keep me signed in" align="start" size="sm" :disabled="loading" />

        <NuxtLink
          to="/auth/recover"
          class="rounded-field text-sm font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
        >
          Forgot password?
        </NuxtLink>
      </div>

      <GorgButton type="submit" size="lg" block :loading="loading" class="mt-2">
        {{ loading ? 'Checking your details…' : 'Sign in' }}
      </GorgButton>
    </form>

    <p class="flex items-start gap-2 rounded-card bg-[var(--surface-sunken)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">
      <Icon name="lucide:info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Demo build — nothing is sent anywhere. Any well-formed email and an
        8-character password will get you through.
      </span>
    </p>
  </div>
</template>
