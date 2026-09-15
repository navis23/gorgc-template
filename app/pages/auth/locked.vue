<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Screen locked' })

const toast = useToast()

/** The session we are holding open — in a real app this comes from the cookie. */
const session = {
  name: 'Amara Osei',
  email: 'amara.osei@meridian.co',
  role: 'Owner · Meridian Freight',
  lockedFor: '12 minutes',
}

const password = ref('')
const error = ref<string | undefined>()
const attempted = ref(false)
const loading = ref(false)
const reveal = ref(false)

function validate(): boolean {
  if (!password.value)
    error.value = 'Enter your password to unlock.'
  else if (password.value.length < 8)
    error.value = 'Passwords are at least 8 characters.'
  else
    error.value = undefined

  return !error.value
}

watch(password, () => {
  if (attempted.value)
    validate()
})

onMounted(() => {
  document.getElementById('locked-password')?.focus()
})

async function onSubmit() {
  attempted.value = true

  if (!validate()) {
    document.getElementById('locked-password')?.focus()
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  loading.value = false

  password.value = ''
  attempted.value = false
  toast.success(`Picking up where ${session.name.split(' ')[0]} left off.`, { title: 'Unlocked' })
}
</script>

<template>
  <div class="space-y-7">
    <header class="flex flex-col items-center gap-4 text-center">
      <div class="relative">
        <GorgAvatar :name="session.name" size="xl" ring />
        <span
          class="absolute -end-1 -bottom-1 grid size-8 place-items-center rounded-pill border-2 border-[var(--surface-page)] bg-ember-600 text-white"
          aria-hidden="true"
        >
          <Icon name="lucide:lock" class="size-4" />
        </span>
      </div>

      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          {{ session.name }}
        </h1>
        <p class="text-sm text-[var(--text-muted)]">{{ session.email }}</p>
        <GorgBadge tone="brand" size="xs" class="mt-1">{{ session.role }}</GorgBadge>
      </div>

      <p class="text-sm leading-relaxed text-balance text-[var(--text-muted)]">
        Your screen locked after {{ session.lockedFor }} of inactivity. Everything
        you had open is still here — confirm your password to carry on.
      </p>
    </header>

    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <GorgFormGroup id="locked-password" label="Password" :error="error" required>
        <GorgInput
          v-model="password"
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

      <GorgButton type="submit" size="lg" block :loading="loading">
        <template v-if="!loading" #lead>
          <Icon name="lucide:lock-open" class="size-4" aria-hidden="true" />
        </template>
        {{ loading ? 'Confirming…' : 'Unlock' }}
      </GorgButton>
    </form>

    <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--surface-border)] pt-6 text-sm">
      <NuxtLink
        to="/auth/login"
        class="rounded-field font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
      >
        Sign in as someone else
      </NuxtLink>
      <NuxtLink
        to="/auth/recover"
        class="rounded-field font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-strong)] hover:underline"
      >
        Forgot password?
      </NuxtLink>
    </div>
  </div>
</template>
