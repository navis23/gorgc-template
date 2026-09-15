<script setup lang="ts">
import { profile } from '~/utils/mock-records'

useHead({ title: 'Edit profile' })

const toast = useToast()

/* ---- sections + jump nav ------------------------------------------------ */

const sections = [
  { id: 'identity', label: 'Identity', icon: 'lucide:user-round', hint: 'Name, handle, bio' },
  { id: 'contact', label: 'Contact', icon: 'lucide:at-sign', hint: 'Email, phone, links' },
  { id: 'preferences', label: 'Preferences', icon: 'lucide:sliders-horizontal', hint: 'Visibility, locale' },
  { id: 'danger', label: 'Danger zone', icon: 'lucide:triangle-alert', hint: 'Deactivate, delete' },
] as const

type SectionId = typeof sections[number]['id']

const activeSection = ref<SectionId>('identity')

function jumpTo(id: SectionId) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Scroll-spy. The shell scrolls #gorg-main rather than the window, so the
// observer has to be told which box to measure against.
let spy: IntersectionObserver | null = null

onMounted(() => {
  const nodes = sections
    .map(section => document.getElementById(section.id))
    .filter((node): node is HTMLElement => node !== null)

  if (!nodes.length)
    return

  spy = new IntersectionObserver((entries) => {
    const first = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

    if (first)
      activeSection.value = first.target.id as SectionId
  }, {
    root: document.getElementById('gorg-main'),
    rootMargin: '-15% 0px -70% 0px',
  })

  nodes.forEach(node => spy?.observe(node))
})

onBeforeUnmount(() => {
  spy?.disconnect()
  spy = null
})

/* ---- form state --------------------------------------------------------- */

interface ProfileForm {
  name: string
  handle: string
  pronouns: string
  role: string
  team: string
  bio: string
  email: string
  phone: string
  website: string
  location: string
  timezone: string
  language: string
  dateFormat: string
  publicProfile: boolean
  showEmail: boolean
  mentionsOnly: boolean
  weeklyDigest: boolean
}

const initial: ProfileForm = {
  name: profile.name,
  handle: profile.handle,
  pronouns: profile.pronouns,
  role: profile.role,
  team: profile.team,
  bio: profile.bio[0] ?? '',
  email: 'noor@gorgsystems.example',
  phone: '+31 10 555 0148',
  website: 'https://noor.build',
  location: profile.location,
  timezone: profile.timezone,
  language: 'en-GB',
  dateFormat: 'dmy',
  publicProfile: true,
  showEmail: false,
  mentionsOnly: true,
  weeklyDigest: false,
}

const form = reactive<ProfileForm>({ ...initial })
const avatar = ref<File[]>([])

const pristine = ref(JSON.stringify(initial))
const saving = ref(false)
const attempted = ref(false)
const touched = reactive<Record<string, boolean>>({})

function touch(field: string) {
  touched[field] = true
}

const dirty = computed(() => JSON.stringify(form) !== pristine.value || avatar.value.length > 0)

/* ---- validation --------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const HANDLE = /^[a-z0-9][a-z0-9-]{2,19}$/
const PHONE = /^[+0-9][0-9\s()-]{5,}$/

const errors = computed<Partial<Record<keyof ProfileForm, string>>>(() => {
  const found: Partial<Record<keyof ProfileForm, string>> = {}

  if (!form.name.trim())
    found.name = 'Enter the name colleagues will recognise.'
  else if (form.name.trim().length < 2)
    found.name = 'That is too short to be a name.'

  if (!form.handle.trim())
    found.handle = 'A handle is required — it forms your profile URL.'
  else if (!HANDLE.test(form.handle))
    found.handle = 'Use 3–20 characters: lowercase letters, numbers or hyphens, starting with a letter or number.'

  if (form.bio.length > 280)
    found.bio = `Trim ${form.bio.length - 280} characters — the bio caps at 280.`

  if (!form.email.trim())
    found.email = 'We need an email address to reach you about your account.'
  else if (!EMAIL.test(form.email))
    found.email = 'That address is missing an @ or a domain.'

  if (form.phone.trim() && !PHONE.test(form.phone))
    found.phone = 'Use digits, spaces, brackets or hyphens, optionally starting with +.'

  if (form.website.trim() && !/^https:\/\/[^\s.]+\.[^\s]{2,}$/.test(form.website))
    found.website = 'Start with https:// and include a domain, e.g. https://example.com'

  return found
})

/** Only nag once the field has been left, or once Save has been pressed. */
function errorFor(field: keyof ProfileForm) {
  return (touched[field] || attempted.value) ? (errors.value[field] ?? '') : ''
}

const errorCount = computed(() => Object.keys(errors.value).length)

const pronounOptions = [
  { label: 'she / her', value: 'she/her' },
  { label: 'he / him', value: 'he/him' },
  { label: 'they / them', value: 'they/them' },
  { label: 'Prefer not to say', value: '—' },
]

const timezoneOptions = [
  { label: 'Europe/Amsterdam (CET)', value: 'Europe/Amsterdam' },
  { label: 'Europe/Lisbon (WET)', value: 'Europe/Lisbon' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
]

const languageOptions = [
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
]

const dateFormatOptions = [
  { label: '15 Sep 2026', value: 'dmy' },
  { label: 'Sep 15, 2026', value: 'mdy' },
  { label: '2026-09-15', value: 'iso' },
]

/* ---- actions ------------------------------------------------------------ */

async function save() {
  attempted.value = true

  if (errorCount.value > 0) {
    toast.error(
      errorCount.value === 1 ? 'One field needs attention before saving.' : `${errorCount.value} fields need attention before saving.`,
      { title: 'Not saved' },
    )
    const firstBad = Object.keys(errors.value)[0]
    document.querySelector<HTMLElement>(`[data-field="${firstBad}"] input, [data-field="${firstBad}"] textarea`)?.focus()
    return
  }

  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 850))
  saving.value = false

  pristine.value = JSON.stringify(form)
  avatar.value = []
  attempted.value = false
  toast.success('Profile updated', { title: 'Saved' })
}

function cancel() {
  Object.assign(form, JSON.parse(pristine.value) as ProfileForm)
  avatar.value = []
  attempted.value = false
  for (const key of Object.keys(touched))
    touched[key] = false
  toast.info('Changes discarded')
}

const deleteOpen = ref(false)
const deleteConfirm = ref('')

function confirmDelete() {
  deleteOpen.value = false
  deleteConfirm.value = ''
  toast.error('Account scheduled for deletion in 30 days', { title: 'Deletion requested' })
}

const navEl = useTemplateRef<HTMLElement>('navEl')
useStagger(navEl, { each: 0.05, y: 8 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Edit profile</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Everything here is visible to your workspace unless a field says otherwise.
        </p>
      </div>
      <GorgButton variant="outline" size="sm" to="/layouts/profile">
        <template #lead>
          <Icon name="lucide:eye" class="size-4" />
        </template>
        View public profile
      </GorgButton>
    </header>

    <div class="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
      <!-- Section jump nav — wide screens only; the sections are in order anyway -->
      <nav
        aria-label="Form sections"
        class="hidden lg:block lg:sticky lg:top-0"
      >
        <ul ref="navEl" class="space-y-1">
          <li v-for="section in sections" :key="section.id">
            <a
              :href="`#${section.id}`"
              :aria-current="activeSection === section.id ? 'true' : undefined"
              class="flex items-start gap-2.5 rounded-field px-3 py-2 transition-colors duration-(--duration-snap)"
              :class="activeSection === section.id
                ? 'bg-tide-100 text-tide-900 dark:bg-tide-900/50 dark:text-tide-100'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
              @click.prevent="jumpTo(section.id)"
            >
              <Icon :name="section.icon" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ section.label }}</span>
                <span class="block truncate text-xs opacity-80">{{ section.hint }}</span>
              </span>
            </a>
          </li>
        </ul>

        <p
          v-if="attempted && errorCount > 0"
          class="mt-3 flex items-start gap-1.5 rounded-field px-3 text-xs font-medium text-[var(--color-critical)]"
        >
          <Icon name="lucide:circle-alert" class="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ errorCount }} {{ errorCount === 1 ? 'field needs' : 'fields need' }} fixing</span>
        </p>
      </nav>

      <form class="min-w-0 space-y-6" novalidate @submit.prevent="save">
        <!-- Identity -->
        <section id="identity" tabindex="-1" class="scroll-mt-4 focus-visible:outline-none">
          <GorgCard>
            <template #title>Identity</template>
            <template #subtitle>How your name appears across the workspace</template>

            <div class="grid gap-4 sm:grid-cols-2">
              <div data-field="name">
                <GorgFormGroup label="Full name" required :error="errorFor('name')">
                  <GorgInput
                    v-model="form.name"
                    type="text"
                    name="name"
                    autocomplete="name"
                    placeholder="Your full name"
                    @blur="touch('name')"
                  />
                </GorgFormGroup>
              </div>

              <div data-field="handle">
                <GorgFormGroup
                  label="Handle"
                  required
                  :error="errorFor('handle')"
                  help="Your profile lives at /people/{handle}."
                >
                  <GorgInput
                    v-model="form.handle"
                    type="text"
                    name="username"
                    autocomplete="username"
                    inputmode="text"
                    spellcheck="false"
                    icon="lucide:at-sign"
                    @blur="touch('handle')"
                  />
                </GorgFormGroup>
              </div>

              <GorgFormGroup label="Pronouns">
                <GorgSelect v-model="form.pronouns" :items="pronounOptions" />
              </GorgFormGroup>

              <div data-field="role">
                <GorgFormGroup label="Job title">
                  <GorgInput
                    v-model="form.role"
                    type="text"
                    name="organization-title"
                    autocomplete="organization-title"
                  />
                </GorgFormGroup>
              </div>

              <div class="sm:col-span-2" data-field="bio">
                <GorgFormGroup
                  label="Bio"
                  hint="Optional"
                  :error="errorFor('bio')"
                  help="Two or three sentences. Shown on your public profile."
                >
                  <GorgTextarea
                    v-model="form.bio"
                    :rows="5"
                    :maxlength="280"
                    placeholder="What you work on, and what people should ask you about."
                    @blur="touch('bio')"
                  />
                </GorgFormGroup>
              </div>

              <div class="sm:col-span-2">
                <GorgFormGroup label="Avatar" help="PNG, JPG or WebP. 2 MB maximum, square crops best.">
                  <GorgFileDrop
                    v-model="avatar"
                    accept="image/png,image/jpeg,image/webp"
                    :max-size="2 * 1024 * 1024"
                    :max-files="1"
                    title="Drop a new avatar here"
                    hint="or click to browse — replaces your current picture"
                  />
                </GorgFormGroup>
              </div>
            </div>
          </GorgCard>
        </section>

        <!-- Contact -->
        <section id="contact" tabindex="-1" class="scroll-mt-4 focus-visible:outline-none">
          <GorgCard>
            <template #title>Contact</template>
            <template #subtitle>How we and your colleagues reach you</template>

            <div class="grid gap-4 sm:grid-cols-2">
              <div data-field="email">
                <GorgFormGroup label="Email" required :error="errorFor('email')">
                  <GorgInput
                    v-model="form.email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    inputmode="email"
                    spellcheck="false"
                    icon="lucide:mail"
                    @blur="touch('email')"
                  />
                </GorgFormGroup>
              </div>

              <div data-field="phone">
                <GorgFormGroup label="Phone" hint="Optional" :error="errorFor('phone')">
                  <GorgInput
                    v-model="form.phone"
                    type="tel"
                    name="tel"
                    autocomplete="tel"
                    inputmode="tel"
                    icon="lucide:phone"
                    @blur="touch('phone')"
                  />
                </GorgFormGroup>
              </div>

              <div data-field="website">
                <GorgFormGroup label="Website" hint="Optional" :error="errorFor('website')">
                  <GorgInput
                    v-model="form.website"
                    type="url"
                    name="url"
                    autocomplete="url"
                    inputmode="url"
                    spellcheck="false"
                    placeholder="https://"
                    icon="lucide:globe"
                    @blur="touch('website')"
                  />
                </GorgFormGroup>
              </div>

              <div data-field="location">
                <GorgFormGroup label="Location">
                  <GorgInput
                    v-model="form.location"
                    type="text"
                    name="address-level2"
                    autocomplete="address-level2"
                    icon="lucide:map-pin"
                  />
                </GorgFormGroup>
              </div>

              <div class="sm:col-span-2">
                <GorgFormGroup label="Timezone" help="Used for meeting suggestions and scheduled digests.">
                  <GorgSelect v-model="form.timezone" :items="timezoneOptions" searchable />
                </GorgFormGroup>
              </div>
            </div>
          </GorgCard>
        </section>

        <!-- Preferences -->
        <section id="preferences" tabindex="-1" class="scroll-mt-4 focus-visible:outline-none">
          <GorgCard>
            <template #title>Preferences</template>
            <template #subtitle>Visibility and locale</template>

            <div class="space-y-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <GorgFormGroup label="Language">
                  <GorgSelect v-model="form.language" :items="languageOptions" />
                </GorgFormGroup>

                <GorgFormGroup label="Date format">
                  <GorgSelect v-model="form.dateFormat" :items="dateFormatOptions" />
                </GorgFormGroup>
              </div>

              <div class="space-y-4 border-t border-[var(--surface-border)] pt-5">
                <GorgSwitch
                  v-model="form.publicProfile"
                  label="Public profile"
                  description="Anyone with the workspace link can open your profile page."
                />
                <GorgSwitch
                  v-model="form.showEmail"
                  label="Show my email address"
                  description="Off by default. Colleagues can still message you in-app."
                />
                <GorgSwitch
                  v-model="form.mentionsOnly"
                  label="Notify me for mentions only"
                  description="Mutes the firehose; @-mentions and direct messages still arrive."
                />
                <GorgSwitch
                  v-model="form.weeklyDigest"
                  label="Weekly digest"
                  description="A Monday summary of what moved in your projects."
                />
              </div>
            </div>
          </GorgCard>
        </section>

        <!-- Danger zone -->
        <section id="danger" tabindex="-1" class="scroll-mt-4 focus-visible:outline-none">
          <GorgCard class="border-[color-mix(in_oklch,var(--color-critical)_35%,var(--surface-border))]">
            <template #title>Danger zone</template>
            <template #subtitle>Both of these need a second pair of eyes</template>

            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-field bg-[var(--surface-sunken)] p-4">
                <div class="min-w-0 flex-1 basis-56">
                  <p class="text-sm font-medium text-[var(--text-strong)]">Deactivate account</p>
                  <p class="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    Hides your profile and signs you out everywhere. Reversible by signing back in.
                  </p>
                </div>
                <GorgButton
                  variant="outline"
                  size="sm"
                  @click="toast.warning('Account deactivated — sign in again to restore it.')"
                >
                  Deactivate
                </GorgButton>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 rounded-field border border-[color-mix(in_oklch,var(--color-critical)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-critical)_8%,transparent)] p-4">
                <div class="min-w-0 flex-1 basis-56">
                  <p class="flex items-center gap-1.5 text-sm font-medium text-[var(--color-critical)]">
                    <Icon name="lucide:triangle-alert" class="size-4 shrink-0" aria-hidden="true" />
                    Delete account
                  </p>
                  <p class="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    Removes your profile, comments and file ownership after a 30-day grace period. Not reversible after that.
                  </p>
                </div>
                <GorgButton variant="danger" size="sm" @click="deleteOpen = true">
                  Delete account
                </GorgButton>
              </div>
            </div>
          </GorgCard>
        </section>

        <!-- Sticky save bar: only unlocks once something actually changed -->
        <GorgFormSave
          :dirty="dirty"
          :loading="saving"
          position="bottom"
          save-label="Save profile"
          dirty-label="Unsaved changes"
          clean-label="Everything is saved"
          @save="save"
          @cancel="cancel"
        />
      </form>
    </div>

    <GorgModal
      v-model:open="deleteOpen"
      title="Delete this account?"
      description="Type the handle to confirm. There is a 30-day grace period before anything is removed."
      size="sm"
    >
      <GorgFormGroup
        :label="`Type “${form.handle}” to confirm`"
        :error="deleteConfirm.length > 0 && deleteConfirm !== form.handle ? 'That does not match the handle.' : ''"
      >
        <GorgInput v-model="deleteConfirm" type="text" autocomplete="off" spellcheck="false" />
      </GorgFormGroup>

      <template #footer>
        <GorgButton variant="ghost" size="sm" @click="deleteOpen = false">Keep my account</GorgButton>
        <GorgButton
          variant="danger"
          size="sm"
          :disabled="deleteConfirm !== form.handle"
          @click="confirmDelete"
        >
          Delete permanently
        </GorgButton>
      </template>
    </GorgModal>
  </div>
</template>
