<script setup lang="ts">
import { gsap } from 'gsap'

useHead({ title: 'Workspace setup' })

/* ---------------------------------------------------------------------- */
/* shape                                                                    */
/* ---------------------------------------------------------------------- */

interface Invite {
  id: number
  email: string
  role: string
}

interface StepMeta {
  key: string
  label: string
  short: string
  icon: string
  blurb: string
}

const steps: StepMeta[] = [
  { key: 'type', label: 'Account type', short: 'Type', icon: 'lucide:layers', blurb: 'How you plan to use the workspace decides which defaults we switch on.' },
  { key: 'details', label: 'Details', short: 'Details', icon: 'lucide:building-2', blurb: 'Name the workspace and tell us roughly where it sits.' },
  { key: 'team', label: 'Team invites', short: 'Team', icon: 'lucide:user-plus', blurb: 'Bring people in now, or leave it empty and do it later.' },
  { key: 'review', label: 'Review', short: 'Review', icon: 'lucide:clipboard-check', blurb: 'One last look before anything is created.' },
]

const accountTypes = [
  { value: 'solo', title: 'Just me', description: 'A private workspace. Nothing shared, nothing to administer.', icon: 'lucide:user' },
  { value: 'team', title: 'A team', description: 'Shared projects, roles and an audit trail. Most people start here.', icon: 'lucide:users' },
  { value: 'enterprise', title: 'Whole company', description: 'SSO, SCIM provisioning, data residency and a named contact.', icon: 'lucide:building-2' },
]

const industries = [
  { label: 'Logistics & freight', value: 'logistics' },
  { label: 'Financial services', value: 'finance' },
  { label: 'Healthcare', value: 'health' },
  { label: 'Software & IT', value: 'software' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Public sector', value: 'public' },
  { label: 'Something else', value: 'other' },
]

const teamSizes = [
  { label: '1 – 9 people', value: '1-9' },
  { label: '10 – 49 people', value: '10-49' },
  { label: '50 – 249 people', value: '50-249' },
  { label: '250 – 999 people', value: '250-999' },
  { label: '1,000 or more', value: '1000+' },
]

const regions = [
  { label: 'Europe (Frankfurt)', value: 'eu-central', icon: 'lucide:globe' },
  { label: 'Europe (Dublin)', value: 'eu-west', icon: 'lucide:globe' },
  { label: 'North America (Ohio)', value: 'us-east', icon: 'lucide:globe' },
  { label: 'Asia Pacific (Singapore)', value: 'ap-southeast', icon: 'lucide:globe' },
]

const roles = [
  { label: 'Admin', value: 'admin', icon: 'lucide:shield' },
  { label: 'Member', value: 'member', icon: 'lucide:user' },
  { label: 'Viewer', value: 'viewer', icon: 'lucide:eye' },
]

/* ---------------------------------------------------------------------- */
/* state — one object, never cleared, so Back always finds what was typed  */
/* ---------------------------------------------------------------------- */

let inviteSeq = 1

const form = reactive({
  accountType: null as string | null,
  orgName: '',
  workspace: '',
  industry: null as string | null,
  size: null as string | null,
  region: 'eu-west' as string | null,
  invites: [{ id: inviteSeq, email: '', role: 'member' }] as Invite[],
  notify: true,
  confirm: false,
})

const step = ref(0)
const furthest = ref(0)
const touched = reactive<boolean[]>([false, false, false, false])
const errors = reactive<Record<string, string | undefined>>({})
const inviteErrors = ref<(string | undefined)[]>([])
const submitting = ref(false)
const done = ref(false)

const current = computed<StepMeta>(() => steps[step.value] ?? steps[0]!)
const isLast = computed(() => step.value === steps.length - 1)
const progress = computed(() => ((step.value + 1) / steps.length) * 100)

/**
 * GorgStepper is keyed by step value; this wizard tracks a numeric index.
 * `disabled` carries the "only ground already covered" rule, which `linear`
 * cannot express — it would block returning forward after stepping back.
 */
const stepperSteps = computed(() => steps.map((meta, index) => ({
  value: meta.key,
  title: meta.label,
  icon: meta.icon,
  disabled: index > furthest.value,
})))

const stepValue = computed({
  get: () => current.value.key,
  set: (key: string) => {
    const index = steps.findIndex(meta => meta.key === key)
    if (index !== -1)
      jump(index)
  },
})

/* ---------------------------------------------------------------------- */
/* validation                                                              */
/* ---------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

// Derive the slug from the name until someone types their own.
const slugTouched = ref(false)
watch(() => form.orgName, (value) => {
  if (!slugTouched.value)
    form.workspace = slugify(value)
})

function validateDetails(): boolean {
  const name = form.orgName.trim()

  if (!name)
    errors.orgName = 'Give the workspace a name.'
  else if (name.length < 2)
    errors.orgName = 'That is a little short.'
  else
    errors.orgName = undefined

  if (!form.workspace)
    errors.workspace = 'Pick a URL for the workspace.'
  else if (!SLUG.test(form.workspace))
    errors.workspace = 'Lowercase letters, numbers and hyphens — 3 to 32 characters.'
  else
    errors.workspace = undefined

  errors.industry = form.industry ? undefined : 'Choose the closest match.'
  errors.size = form.size ? undefined : 'Roughly how many people?'

  return !errors.orgName && !errors.workspace && !errors.industry && !errors.size
}

function validateInvites(): boolean {
  const seen = new Set<string>()
  const next: (string | undefined)[] = []

  for (const invite of form.invites) {
    const value = invite.email.trim().toLowerCase()
    if (!value) {
      next.push(undefined)
      continue
    }
    if (!EMAIL.test(value)) {
      next.push('That does not look like an email address.')
      continue
    }
    if (seen.has(value)) {
      next.push('This address is already on the list.')
      continue
    }
    seen.add(value)
    next.push(undefined)
  }

  inviteErrors.value = next
  return next.every(message => !message)
}

function validateStep(index: number): boolean {
  switch (index) {
    case 0:
      errors.accountType = form.accountType ? undefined : 'Pick the shape that fits best.'
      return !errors.accountType
    case 1:
      return validateDetails()
    case 2:
      return validateInvites()
    case 3:
      errors.confirm = form.confirm ? undefined : 'Confirm the summary to finish.'
      return !errors.confirm
    default:
      return true
  }
}

// Once a step has been attempted, correct it live rather than on the next click.
watch(form, () => {
  if (touched[step.value])
    validateStep(step.value)
}, { deep: true })

function focusFirstProblem() {
  const ids: Record<number, (string | undefined)[]> = {
    0: [errors.accountType ? 'wiz-type' : undefined],
    1: [
      errors.orgName ? 'wiz-org' : undefined,
      errors.workspace ? 'wiz-slug' : undefined,
      errors.industry ? 'wiz-industry' : undefined,
      errors.size ? 'wiz-size' : undefined,
    ],
    2: [form.invites.find((_, i) => inviteErrors.value[i])].map(row => (row ? `wiz-invite-${row.id}` : undefined)),
    3: [errors.confirm ? 'wiz-confirm' : undefined],
  }

  const target = (ids[step.value] ?? []).find(Boolean)
  if (target)
    document.getElementById(target)?.focus()
}

/* ---------------------------------------------------------------------- */
/* navigation                                                              */
/* ---------------------------------------------------------------------- */

const direction = ref(1)

function goTo(index: number) {
  if (index === step.value)
    return
  direction.value = index > step.value ? 1 : -1
  step.value = index
  furthest.value = Math.max(furthest.value, index)
}

function next() {
  touched[step.value] = true

  if (!validateStep(step.value)) {
    focusFirstProblem()
    return
  }

  if (isLast.value) {
    submit()
    return
  }

  goTo(step.value + 1)
}

function back() {
  if (step.value > 0)
    goTo(step.value - 1)
}

function jump(index: number) {
  // Only backwards, or forwards into ground already covered.
  if (index <= furthest.value)
    goTo(index)
}

async function submit() {
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  submitting.value = false
  direction.value = 1
  done.value = true
}

function restart() {
  direction.value = -1
  done.value = false
  step.value = 0
  furthest.value = 0
  inviteSeq = 1
  Object.assign(form, {
    accountType: null,
    orgName: '',
    workspace: '',
    industry: null,
    size: null,
    region: 'eu-west',
    invites: [{ id: inviteSeq, email: '', role: 'member' }],
    notify: true,
    confirm: false,
  })
  slugTouched.value = false
  inviteErrors.value = []
  for (const key of Object.keys(errors))
    errors[key] = undefined
  touched.fill(false)
}

/* ---------------------------------------------------------------------- */
/* invites                                                                 */
/* ---------------------------------------------------------------------- */

const MAX_INVITES = 8

const filledInvites = computed(() => form.invites.filter(invite => invite.email.trim().length > 0))

function addInvite() {
  if (form.invites.length >= MAX_INVITES)
    return
  inviteSeq += 1
  const row: Invite = { id: inviteSeq, email: '', role: 'member' }
  form.invites.push(row)
  nextTick(() => document.getElementById(`wiz-invite-${row.id}`)?.focus())
}

function removeInvite(index: number) {
  form.invites.splice(index, 1)
  inviteErrors.value.splice(index, 1)
  if (!form.invites.length)
    addInvite()
}

/* ---------------------------------------------------------------------- */
/* review helpers                                                          */
/* ---------------------------------------------------------------------- */

function labelFor(list: { label: string, value: string }[], value: string | null): string {
  return list.find(item => item.value === value)?.label ?? 'Not set'
}

const accountTypeLabel = computed(() =>
  accountTypes.find(item => item.value === form.accountType)?.title ?? 'Not set')

const summary = computed(() => [
  {
    heading: 'Account',
    step: 0,
    rows: [
      { term: 'Type', value: accountTypeLabel.value },
    ],
  },
  {
    heading: 'Workspace',
    step: 1,
    rows: [
      { term: 'Name', value: form.orgName.trim() || 'Not set' },
      { term: 'URL', value: `gorg.app/${form.workspace || '…'}` },
      { term: 'Industry', value: labelFor(industries, form.industry) },
      { term: 'Team size', value: labelFor(teamSizes, form.size) },
      { term: 'Data region', value: labelFor(regions, form.region) },
    ],
  },
  {
    heading: 'Team',
    step: 2,
    rows: [
      {
        term: 'Invitations',
        value: filledInvites.value.length
          ? `${filledInvites.value.length} ${filledInvites.value.length === 1 ? 'person' : 'people'}`
          : 'None for now',
      },
      { term: 'Welcome email', value: form.notify ? 'Send on creation' : 'Do not send' },
    ],
  },
])

/* ---------------------------------------------------------------------- */
/* motion                                                                  */
/* ---------------------------------------------------------------------- */

function onEnter(el: Element, complete: () => void) {
  gsap.fromTo(el,
    { autoAlpha: 0, x: 32 * direction.value },
    {
      autoAlpha: 1,
      x: 0,
      duration: 0.42,
      ease: 'power3.out',
      clearProps: 'transform,opacity,visibility',
      onComplete: complete,
    },
  )
}

function onLeave(el: Element, complete: () => void) {
  gsap.to(el, {
    autoAlpha: 0,
    x: -32 * direction.value,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: complete,
  })
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <header class="space-y-1">
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Workspace setup</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Four short steps. Nothing is created until you confirm the summary.
      </p>
    </header>

    <!-- step indicator -->
    <GorgStepper
      v-if="!done"
      v-model="stepValue"
      :steps="stepperSteps"
      aria-label="Setup progress"
    />

    <Transition :css="false" mode="out-in" @enter="onEnter" @leave="onLeave">
      <!-- ------------------------------------------------------------- -->
      <!-- success                                                        -->
      <!-- ------------------------------------------------------------- -->
      <GorgCard v-if="done" key="done" class="text-center" elevation="float">
        <div class="mx-auto max-w-md space-y-6 py-6">
          <span class="mx-auto grid size-16 place-items-center rounded-pill bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]">
            <Icon name="lucide:check" class="size-8" aria-hidden="true" />
          </span>

          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-[var(--text-strong)]">
              {{ form.orgName.trim() || 'Your workspace' }} is ready
            </h2>
            <p class="text-sm leading-relaxed text-[var(--text-muted)]">
              Live at <span class="font-medium text-[var(--text-strong)]">gorg.app/{{ form.workspace }}</span>
              in {{ labelFor(regions, form.region) }}.
              <template v-if="filledInvites.length">
                {{ filledInvites.length }} {{ filledInvites.length === 1 ? 'invitation is' : 'invitations are' }}
                on the way.
              </template>
              <template v-else>
                You can invite people whenever you are ready.
              </template>
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2">
            <GorgButton to="/" size="lg">
              <template #lead>
                <Icon name="lucide:layout-dashboard" class="size-4" aria-hidden="true" />
              </template>
              Open the dashboard
            </GorgButton>
            <GorgButton variant="ghost" size="lg" @click="restart">
              Run it again
            </GorgButton>
          </div>
        </div>
      </GorgCard>

      <!-- ------------------------------------------------------------- -->
      <!-- step body                                                      -->
      <!-- ------------------------------------------------------------- -->
      <GorgCard v-else :key="current.key" :padded="false">
        <div class="space-y-6 px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
          <header class="space-y-1">
            <h2 class="text-base font-semibold text-[var(--text-strong)]">{{ current.label }}</h2>
            <p class="text-sm text-[var(--text-muted)]">{{ current.blurb }}</p>
          </header>

          <!-- 1 — account type -->
          <div v-if="step === 0">
            <GorgFormGroup id="wiz-type-group" :error="errors.accountType">
              <GorgRadioGroup v-model="form.accountType" label="Account type">
                <GorgRadioCard
                  v-for="(option, index) in accountTypes"
                  :key="option.value"
                  :id="index === 0 ? 'wiz-type' : undefined"
                  :value="option.value"
                  :title="option.title"
                  :description="option.description"
                  :icon="option.icon"
                />
              </GorgRadioGroup>
            </GorgFormGroup>
          </div>

          <!-- 2 — details -->
          <div v-else-if="step === 1" class="space-y-5">
            <GorgFormGroup id="wiz-org" label="Workspace name" :error="errors.orgName" required>
              <GorgInput v-model="form.orgName" type="text" placeholder="Meridian Freight" icon="lucide:building-2" />
            </GorgFormGroup>

            <GorgFormGroup
              id="wiz-slug"
              label="Workspace URL"
              :error="errors.workspace"
              :help="errors.workspace ? undefined : `Your team will find it at gorg.app/${form.workspace || 'your-workspace'}`"
              required
            >
              <GorgInput
                v-model="form.workspace"
                type="text"
                placeholder="meridian-freight"
                icon="lucide:link"
                @input="slugTouched = true"
              />
            </GorgFormGroup>

            <div class="grid gap-5 sm:grid-cols-2">
              <GorgFormGroup id="wiz-industry" label="Industry" :error="errors.industry" required>
                <GorgSelect v-model="form.industry" :items="industries" placeholder="Choose an industry" />
              </GorgFormGroup>

              <GorgFormGroup id="wiz-size" label="Team size" :error="errors.size" required>
                <GorgSelect v-model="form.size" :items="teamSizes" placeholder="Choose a range" />
              </GorgFormGroup>
            </div>

            <GorgFormGroup
              id="wiz-region"
              label="Data region"
              help="Where your records are stored. This cannot be changed later."
            >
              <GorgSelect v-model="form.region" :items="regions" />
            </GorgFormGroup>
          </div>

          <!-- 3 — invites -->
          <div v-else-if="step === 2" class="space-y-5">
            <div class="hidden gap-3 px-1 text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase sm:grid sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem]" aria-hidden="true">
              <span>Email address</span>
              <span>Role</span>
              <span class="sr-only">Remove</span>
            </div>

            <ul class="space-y-3">
              <li
                v-for="(invite, index) in form.invites"
                :key="invite.id"
                class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem] sm:items-start"
              >
                <GorgFormGroup :id="`wiz-invite-${invite.id}`" :error="inviteErrors[index]">
                  <GorgLabel :for="`wiz-invite-${invite.id}`" sr-only>
                    Email address for teammate {{ index + 1 }}
                  </GorgLabel>
                  <GorgInput v-model="invite.email" type="email" placeholder="teammate@company.com" icon="lucide:mail" />
                </GorgFormGroup>

                <GorgFormGroup :id="`wiz-role-${invite.id}`">
                  <GorgLabel :for="`wiz-role-${invite.id}`" sr-only>
                    Role for teammate {{ index + 1 }}
                  </GorgLabel>
                  <GorgSelect v-model="invite.role" :items="roles" />
                </GorgFormGroup>

                <button
                  type="button"
                  class="inline-flex size-10 items-center justify-center justify-self-start rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--color-critical)] disabled:pointer-events-none disabled:opacity-40"
                  :disabled="form.invites.length === 1 && !invite.email"
                  :aria-label="`Remove teammate ${index + 1}`"
                  @click="removeInvite(index)"
                >
                  <Icon name="lucide:trash-2" class="size-4" aria-hidden="true" />
                </button>
              </li>
            </ul>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <GorgButton
                variant="outline"
                size="sm"
                :disabled="form.invites.length >= MAX_INVITES"
                @click="addInvite"
              >
                <template #lead>
                  <Icon name="lucide:plus" class="size-4" aria-hidden="true" />
                </template>
                Add another
              </GorgButton>
              <p class="text-xs text-[var(--text-muted)]">
                {{ form.invites.length }} of {{ MAX_INVITES }} rows · blank rows are ignored
              </p>
            </div>

            <div class="rounded-card border border-[var(--surface-border)] bg-[var(--surface-sunken)] p-4">
              <GorgSwitch
                v-model="form.notify"
                label="Send a welcome email"
                description="Everyone above gets a short introduction with a link into the workspace."
              />
            </div>
          </div>

          <!-- 4 — review -->
          <div v-else class="space-y-5">
            <div
              v-for="section in summary"
              :key="section.heading"
              class="rounded-card border border-[var(--surface-border)]"
            >
              <div class="flex items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
                <h3 class="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  {{ section.heading }}
                </h3>
                <GorgButton variant="ghost" size="xs" @click="jump(section.step)">
                  <template #lead>
                    <Icon name="lucide:pencil" class="size-3.5" aria-hidden="true" />
                  </template>
                  Edit
                </GorgButton>
              </div>

              <dl class="divide-y divide-[var(--surface-border)]">
                <div
                  v-for="row in section.rows"
                  :key="row.term"
                  class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-2.5"
                >
                  <dt class="text-sm text-[var(--text-muted)]">{{ row.term }}</dt>
                  <dd class="text-sm font-medium text-[var(--text-strong)]">{{ row.value }}</dd>
                </div>
              </dl>
            </div>

            <div v-if="filledInvites.length" class="rounded-card border border-[var(--surface-border)]">
              <h3 class="border-b border-[var(--surface-border)] px-4 py-2.5 text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Who gets invited
              </h3>
              <ul class="divide-y divide-[var(--surface-border)]">
                <li
                  v-for="invite in filledInvites"
                  :key="invite.id"
                  class="flex items-center gap-3 px-4 py-2.5"
                >
                  <GorgAvatar :name="invite.email.split('@')[0]?.replace(/[._-]+/g, ' ')" size="sm" />
                  <span class="min-w-0 flex-1 truncate text-sm text-[var(--text-strong)]">{{ invite.email.trim() }}</span>
                  <GorgBadge :tone="invite.role === 'admin' ? 'accent' : 'neutral'" size="xs">
                    {{ labelFor(roles, invite.role) }}
                  </GorgBadge>
                </li>
              </ul>
            </div>

            <GorgFormGroup :error="errors.confirm">
              <GorgCheckbox id="wiz-confirm" v-model="form.confirm" label="Everything above is correct">
                <template #description>
                  Creating the workspace provisions storage in
                  {{ labelFor(regions, form.region) }} and sends any invitations listed.
                </template>
              </GorgCheckbox>
            </GorgFormGroup>
          </div>
        </div>

        <!-- footer controls -->
        <template #footer>
          <div class="flex items-center justify-between gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            <GorgButton
              variant="ghost"
              :disabled="step === 0 || submitting"
              @click="back"
            >
              <template #lead>
                <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
              </template>
              Back
            </GorgButton>

            <div class="flex items-center gap-3">
              <p class="hidden text-xs text-[var(--text-muted)] sm:block">
                Step {{ step + 1 }} of {{ steps.length }}
              </p>
              <GorgButton :loading="submitting" @click="next">
                <template v-if="!isLast" #trail>
                  <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
                </template>
                {{ isLast ? (submitting ? 'Creating…' : 'Create workspace') : 'Continue' }}
              </GorgButton>
            </div>
          </div>
        </template>
      </GorgCard>
    </Transition>
  </div>
</template>
