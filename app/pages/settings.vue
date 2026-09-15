<script setup lang="ts">
import type { GorgTabItem } from '~/components/nav/nav'

useHead({ title: 'Settings' })

const toast = useToast()

const tabs: GorgTabItem[] = [
  { value: 'profile', label: 'Profile', icon: 'lucide:user' },
  { value: 'security', label: 'Security', icon: 'lucide:shield' },
  { value: 'notifications', label: 'Notifications', icon: 'lucide:bell', badge: 2 },
  { value: 'billing', label: 'Billing', icon: 'lucide:credit-card' },
]
const tab = ref('profile')

// --- profile ---------------------------------------------------------------
const profile = reactive({
  name: 'Amara Osei',
  email: 'amara.osei@example.com',
  role: 'Platform Engineer',
  timezone: 'Europe/Lisbon',
  bio: 'Keeps the deploy pipeline honest. Mostly Go and Terraform.',
})
const pristine = JSON.stringify(profile)
const dirty = computed(() => JSON.stringify(profile) !== pristine)
const saving = ref(false)

const timezones = [
  { label: 'Europe/Lisbon (WET)', value: 'Europe/Lisbon' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
]

const emailError = computed(() =>
  profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    ? 'Enter a valid email address'
    : '')

async function save() {
  if (emailError.value)
    return
  saving.value = true
  await new Promise(r => setTimeout(r, 900))
  saving.value = false
  toast.success('Profile updated', { title: 'Saved' })
}

// --- security --------------------------------------------------------------
const security = reactive({ twoFactor: true, sessionAlerts: true, passkeys: false })

const sessions = [
  { id: 1, device: 'MacBook Pro · Lisbon', browser: 'Chrome 141', current: true, at: 'Active now' },
  { id: 2, device: 'iPhone 16 · Lisbon', browser: 'Safari', current: false, at: '2 hours ago' },
  { id: 3, device: 'Linux workstation · Porto', browser: 'Firefox 145', current: false, at: 'Yesterday' },
]

// --- notifications ---------------------------------------------------------
const notify = reactive({
  deploys: true, incidents: true, mentions: true,
  digest: false, marketing: false,
})

// --- billing ---------------------------------------------------------------
const invoices = [
  { key: 'INV-2041', period: 'Sep 2026', amount: '$240.00', status: 'paid' },
  { key: 'INV-2032', period: 'Aug 2026', amount: '$240.00', status: 'paid' },
  { key: 'INV-2019', period: 'Jul 2026', amount: '$180.00', status: 'paid' },
  { key: 'INV-2004', period: 'Jun 2026', amount: '$180.00', status: 'refunded' },
]
const invoiceColumns = [
  { key: 'key', label: 'Invoice' },
  { key: 'period', label: 'Period' },
  { key: 'amount', label: 'Amount', align: 'end' as const },
  { key: 'status', label: 'Status', align: 'center' as const },
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Settings</h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Manage your profile, security and billing preferences.
      </p>
    </header>

    <GorgTabs v-model="tab" :items="tabs" variant="underline" aria-label="Settings sections">
      <!-- Profile -->
      <template #profile>
        <div class="grid gap-4 lg:grid-cols-3">
          <GorgCard class="lg:col-span-2">
            <template #title>Personal details</template>

            <div class="grid gap-4 sm:grid-cols-2">
              <GorgFormGroup label="Full name" required>
                <GorgInput v-model="profile.name" autocomplete="name" />
              </GorgFormGroup>

              <GorgFormGroup label="Email" required :error="emailError">
                <GorgInput v-model="profile.email" type="email" autocomplete="email" />
              </GorgFormGroup>

              <GorgFormGroup label="Job title">
                <GorgInput v-model="profile.role" />
              </GorgFormGroup>

              <GorgFormGroup label="Timezone" help="Used for scheduled reports.">
                <GorgSelect v-model="profile.timezone" :items="timezones" searchable />
              </GorgFormGroup>

              <div class="sm:col-span-2">
                <GorgFormGroup label="Bio" hint="Shown on your public profile.">
                  <GorgTextarea v-model="profile.bio" :rows="3" :maxlength="240" />
                </GorgFormGroup>
              </div>
            </div>
          </GorgCard>

          <div class="space-y-4">
            <GorgCard>
              <template #title>Avatar</template>
              <div class="flex items-center gap-4">
                <GorgAvatar :name="profile.name" size="xl" />
                <div class="min-w-0 space-y-2">
                  <GorgButton variant="outline" size="sm">Upload</GorgButton>
                  <p class="text-xs text-[var(--text-muted)]">PNG or JPG, up to 2&nbsp;MB.</p>
                </div>
              </div>
            </GorgCard>

            <GorgCard>
              <template #title>Danger zone</template>
              <p class="text-sm text-[var(--text-muted)]">
                Deleting your account removes all workspaces you solely own. This cannot be undone.
              </p>
              <template #footer>
                <GorgButton variant="danger" size="sm">Delete account</GorgButton>
              </template>
            </GorgCard>
          </div>
        </div>

        <GorgFormSave
          :dirty="dirty"
          :loading="saving"
          position="static"
          class="mt-4"
          @save="save"
        />
      </template>

      <!-- Security -->
      <template #security>
        <div class="grid gap-4 lg:grid-cols-2">
          <GorgCard>
            <template #title>Authentication</template>
            <div class="space-y-4">
              <GorgSwitch
                v-model="security.twoFactor"
                label="Two-factor authentication"
                description="Require a one-time code at sign-in."
              />
              <GorgSwitch
                v-model="security.passkeys"
                label="Passkeys"
                description="Allow signing in with a device passkey instead of a password."
              />
              <GorgSwitch
                v-model="security.sessionAlerts"
                label="New sign-in alerts"
                description="Email me when a new device signs in."
              />
            </div>
          </GorgCard>

          <GorgCard>
            <template #title>Change password</template>
            <div class="space-y-4">
              <GorgFormGroup label="Current password">
                <GorgInput type="password" autocomplete="current-password" />
              </GorgFormGroup>
              <GorgFormGroup label="New password" help="At least 12 characters.">
                <GorgInput type="password" autocomplete="new-password" />
              </GorgFormGroup>
            </div>
            <template #footer>
              <GorgButton size="sm">Update password</GorgButton>
            </template>
          </GorgCard>

          <GorgCard class="lg:col-span-2" :padded="false">
            <div class="p-5 pb-0">
              <h3 class="text-sm font-semibold text-[var(--text-strong)]">Active sessions</h3>
            </div>
            <ul class="mt-4 divide-y divide-[var(--surface-border)]">
              <li v-for="s in sessions" :key="s.id" class="flex flex-wrap items-center gap-3 px-5 py-3">
                <Icon name="lucide:monitor" class="size-4 shrink-0 text-[var(--text-muted)]" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ s.device }}</p>
                  <p class="truncate text-xs text-[var(--text-muted)]">{{ s.browser }} · {{ s.at }}</p>
                </div>
                <GorgBadge v-if="s.current" tone="positive" size="xs" dot>This device</GorgBadge>
                <GorgButton v-else variant="ghost" size="xs">Revoke</GorgButton>
              </li>
            </ul>
          </GorgCard>
        </div>
      </template>

      <!-- Notifications -->
      <template #notifications>
        <GorgCard class="max-w-2xl">
          <template #title>Email notifications</template>
          <template #subtitle>Choose what lands in your inbox.</template>

          <div class="space-y-4">
            <GorgSwitch v-model="notify.incidents" label="Incidents" description="Paging and severity changes." />
            <GorgSwitch v-model="notify.deploys" label="Deploys" description="Every production release." />
            <GorgSwitch v-model="notify.mentions" label="Mentions" description="When someone @-mentions you." />
            <GorgSwitch v-model="notify.digest" label="Weekly digest" description="A Monday summary of the week." />
            <GorgSwitch v-model="notify.marketing" label="Product news" description="Occasional feature announcements." />
          </div>
        </GorgCard>
      </template>

      <!-- Billing -->
      <template #billing>
        <div class="grid gap-4 lg:grid-cols-3">
          <GorgCard class="lg:col-span-2">
            <template #title>Current plan</template>
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="flex items-center gap-2">
                  <span class="text-2xl font-semibold text-[var(--text-strong)]">Team</span>
                  <GorgBadge tone="brand" size="xs">Annual</GorgBadge>
                </p>
                <p class="mt-1 text-sm text-[var(--text-muted)]">$240 / month · renews 1 Oct 2026</p>
              </div>
              <div class="flex gap-2">
                <GorgButton variant="outline" size="sm">Change plan</GorgButton>
                <GorgButton variant="ghost" size="sm">Cancel</GorgButton>
              </div>
            </div>

            <div class="mt-5 space-y-3">
              <GorgProgress :value="62" label="Seats used" show-value size="sm" />
              <GorgProgress :value="38" label="Storage" show-value size="sm" tone="accent" />
            </div>
          </GorgCard>

          <GorgCard>
            <template #title>Payment method</template>
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-field bg-[var(--surface-sunken)]">
                <Icon name="lucide:credit-card" class="size-5 text-[var(--text-muted)]" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-[var(--text-strong)]">•••• 4242</p>
                <p class="text-xs text-[var(--text-muted)]">Expires 09 / 2029</p>
              </div>
            </div>
            <template #footer>
              <GorgButton variant="outline" size="sm" block>Update card</GorgButton>
            </template>
          </GorgCard>

          <GorgCard class="lg:col-span-3" :padded="false">
            <div class="p-5 pb-3">
              <h3 class="text-sm font-semibold text-[var(--text-strong)]">Invoices</h3>
            </div>
            <GorgTable :columns="invoiceColumns" :rows="invoices" row-key="key" hoverable>
              <template #cell-status="{ value }">
                <GorgBadge :tone="value === 'paid' ? 'positive' : 'neutral'" size="xs" dot>
                  {{ value }}
                </GorgBadge>
              </template>
            </GorgTable>
          </GorgCard>
        </div>
      </template>
    </GorgTabs>
  </div>
</template>
