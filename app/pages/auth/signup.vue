<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Create your account' })

const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  terms: false,
})

const errors = reactive<{ name?: string, email?: string, password?: string, terms?: string }>({})
const attempted = ref(false)
const loading = ref(false)
const reveal = ref(false)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const COMMON = /password|qwerty|letmein|welcome|admin|iloveyou|123456|abcdef|monkey|dragon/i

type StrengthTone = 'critical' | 'caution' | 'brand' | 'positive'

interface Strength {
  score: number
  label: string
  tone: StrengthTone
  advice: string
}

/**
 * A deliberately small, dependency-free scorer. It rewards length first
 * (the only thing that reliably buys entropy), then character variety, then
 * docks points for the shapes that show up in every breach corpus.
 */
function scorePassword(value: string): Strength {
  if (!value)
    return { score: 0, label: 'Empty', tone: 'critical', advice: 'Twelve characters or more is the single best thing you can do.' }

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(value)).length
  const unique = new Set(value).size

  let score = 0
  score += Math.min(44, Math.max(0, value.length - 4) * 5.5)
  score += classes * 11
  score += Math.min(12, unique * 1.5)

  if (COMMON.test(value))
    score -= 38
  if (/^\d+$/.test(value) || /^[A-Za-z]+$/.test(value))
    score -= 14
  if (/(.)\1{2,}/.test(value))
    score -= 10
  if (value.length < 8)
    score = Math.min(score, 28)

  score = Math.round(Math.max(0, Math.min(100, score)))

  if (score < 30)
    return { score, label: 'Weak', tone: 'critical', advice: 'Too easy to guess. Try a short phrase you will remember.' }
  if (score < 55)
    return { score, label: 'Fair', tone: 'caution', advice: 'Getting there. Length helps more than punctuation does.' }
  if (score < 80)
    return { score, label: 'Good', tone: 'brand', advice: 'Solid. A symbol or a few more characters would finish it off.' }
  return { score, label: 'Strong', tone: 'positive', advice: 'Strong enough. Store it in a password manager.' }
}

const strength = computed(() => scorePassword(form.password))

const rules = computed(() => [
  { label: '12 characters or more', met: form.password.length >= 12 },
  { label: 'Upper and lower case', met: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
  { label: 'A number', met: /\d/.test(form.password) },
  { label: 'A symbol', met: /[^A-Za-z0-9]/.test(form.password) },
])

function validate(): boolean {
  const name = form.name.trim()
  const email = form.email.trim()

  if (!name)
    errors.name = 'We need something to call you.'
  else if (name.length < 2)
    errors.name = 'That is a little short for a name.'
  else
    errors.name = undefined

  if (!email)
    errors.email = 'Enter a work email you can access.'
  else if (!EMAIL.test(email))
    errors.email = 'That does not look like an email address.'
  else
    errors.email = undefined

  if (!form.password)
    errors.password = 'Choose a password.'
  else if (form.password.length < 8)
    errors.password = 'Use at least 8 characters.'
  else if (strength.value.score < 30)
    errors.password = 'Too easy to guess — try a longer phrase.'
  else
    errors.password = undefined

  errors.terms = form.terms ? undefined : 'You will need to accept the terms to continue.'

  return !errors.name && !errors.email && !errors.password && !errors.terms
}

watch(form, () => {
  if (attempted.value)
    validate()
})

async function onSubmit() {
  attempted.value = true

  if (!validate()) {
    const first = errors.name ? 'signup-name' : errors.email ? 'signup-email' : errors.password ? 'signup-password' : 'signup-terms'
    document.getElementById(first)?.focus()
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  loading.value = false

  toast.success(`We sent a confirmation link to ${form.email.trim()}.`, { title: 'Account created' })
  await navigateTo('/auth/verify')
}
</script>

<template>
  <div class="space-y-7">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
        Create your account
      </h1>
      <p class="text-sm text-[var(--text-muted)]">
        Already with us?
        <NuxtLink
          to="/auth/login"
          class="rounded-field font-medium text-tide-700 underline-offset-4 hover:underline dark:text-tide-300"
        >
          Sign in instead
        </NuxtLink>
      </p>
    </header>

    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <GorgFormGroup id="signup-name" label="Full name" :error="errors.name" required>
        <GorgInput
          v-model="form.name"
          type="text"
          name="name"
          autocomplete="name"
          placeholder="Amara Osei"
          icon="lucide:user"
          :disabled="loading"
        />
      </GorgFormGroup>

      <GorgFormGroup id="signup-email" label="Work email" :error="errors.email" required>
        <GorgInput
          v-model="form.email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="you@company.com"
          icon="lucide:mail"
          :disabled="loading"
        />
      </GorgFormGroup>

      <GorgFormGroup
        id="signup-password"
        label="Password"
        :error="errors.password"
        :help="errors.password ? undefined : `Strength: ${strength.label}. ${strength.advice}`"
        required
      >
        <GorgInput
          v-model="form.password"
          :type="reveal ? 'text' : 'password'"
          name="password"
          autocomplete="new-password"
          placeholder="At least 12 characters"
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

        <!-- The meter is a picture of the sentence already in the field help,
             so it stays out of the accessibility tree. -->
        <div class="mt-3 space-y-3" aria-hidden="true">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-[var(--text-muted)]">Password strength</span>
            <span
              class="text-xs font-semibold"
              :class="{
                'text-[var(--color-critical)]': strength.tone === 'critical',
                'text-[var(--color-caution)]': strength.tone === 'caution',
                'text-tide-700 dark:text-tide-300': strength.tone === 'brand',
                'text-[var(--color-positive)]': strength.tone === 'positive',
              }"
            >{{ strength.label }}</span>
          </div>

          <GorgProgress :value="strength.score" :tone="strength.tone" size="xs" />

          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <li
              v-for="rule in rules"
              :key="rule.label"
              class="flex items-center gap-1.5 text-xs transition-colors duration-(--duration-base)"
              :class="rule.met ? 'text-[var(--color-positive)]' : 'text-[var(--text-muted)]'"
            >
              <Icon
                :name="rule.met ? 'lucide:circle-check' : 'lucide:circle-dashed'"
                class="size-3.5 shrink-0"
              />
              {{ rule.label }}
            </li>
          </ul>
        </div>
      </GorgFormGroup>

      <GorgFormGroup :error="errors.terms" class="pt-1">
        <GorgCheckbox id="signup-terms" v-model="form.terms" label="I accept the terms" :disabled="loading">
          <template #description>
            You agree to our
            <a href="#" class="rounded-field font-medium text-tide-700 underline-offset-2 hover:underline dark:text-tide-300">Terms of Service</a>
            and
            <a href="#" class="rounded-field font-medium text-tide-700 underline-offset-2 hover:underline dark:text-tide-300">Privacy Policy</a>.
          </template>
        </GorgCheckbox>
      </GorgFormGroup>

      <GorgButton type="submit" size="lg" block :loading="loading" class="mt-2">
        {{ loading ? 'Setting things up…' : 'Create account' }}
      </GorgButton>
    </form>
  </div>
</template>
