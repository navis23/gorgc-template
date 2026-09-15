<script setup lang="ts">
import type { GorgDropdownItem, GorgTabItem } from '~/components/nav/nav'
import type { ProfileSkill } from '~/utils/mock-records'
import {
  profile,
  profileActivity,
  profileFiles,
  profileProjects,
  profileSkills,
  profileStats,
} from '~/utils/mock-records'

useHead({ title: `${profile.name} · Profile` })

const toast = useToast()

const tabs: GorgTabItem[] = [
  { value: 'overview', label: 'Overview', icon: 'lucide:user-round' },
  { value: 'projects', label: 'Projects', icon: 'lucide:folder-kanban', badge: profileProjects.length },
  { value: 'files', label: 'Files', icon: 'lucide:paperclip', badge: profileFiles.length },
]
const tab = ref('overview')

const following = ref(false)

function toggleFollow() {
  following.value = !following.value
  if (following.value)
    toast.success(`Following ${profile.name}`, { title: 'Subscribed' })
  else
    toast.info(`Stopped following ${profile.name}`)
}

const more: GorgDropdownItem[] = [
  { label: 'Copy profile link', icon: 'lucide:link', onSelect: () => toast.info('Profile link copied') },
  { label: 'Add to a team', icon: 'lucide:users' },
  { label: 'Export activity (CSV)', icon: 'lucide:download' },
  { separator: true },
  { label: 'Report this profile', icon: 'lucide:flag', destructive: true },
]

/** Depth is never shown by colour alone — each tone carries its own word. */
const skillTone = {
  core: 'brand',
  working: 'neutral',
  learning: 'accent',
} as const satisfies Record<ProfileSkill['depth'], string>

const skillWord = {
  core: 'core skill',
  working: 'working knowledge',
  learning: 'learning',
} as const satisfies Record<ProfileSkill['depth'], string>

const skillGroups = (['core', 'working', 'learning'] as const).map(depth => ({
  depth,
  label: skillWord[depth],
  items: profileSkills.filter(skill => skill.depth === depth),
})).filter(group => group.items.length > 0)

const activityChip: Record<string, string> = {
  brand: 'bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200',
  accent: 'bg-ember-100 text-ember-700 dark:bg-ember-900/50 dark:text-ember-200',
  positive: 'bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]',
  caution: 'bg-[color-mix(in_oklch,var(--color-caution)_22%,transparent)] text-[var(--color-caution)]',
  info: 'bg-[color-mix(in_oklch,var(--color-info)_16%,transparent)] text-[var(--color-info)]',
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]',
}

const projectStatus = {
  shipped: { tone: 'positive', icon: 'lucide:circle-check', label: 'Shipped' },
  active: { tone: 'brand', icon: 'lucide:circle-dot', label: 'Active' },
  paused: { tone: 'neutral', icon: 'lucide:circle-pause', label: 'Paused' },
} as const

const heroEl = useTemplateRef<HTMLElement>('heroEl')
const statsEl = useTemplateRef<HTMLElement>('statsEl')
const activityEl = useTemplateRef<HTMLElement>('activityEl')

useReveal(heroEl, { y: 14, duration: 0.45 })
useStagger(statsEl, { each: 0.06, y: 12 })
useStagger(activityEl, { each: 0.05, y: 14 })
</script>

<template>
  <div class="space-y-6">
    <!-- Hero: cover band, overlapping avatar, identity, actions -->
    <div ref="heroEl" class="js-reveal">
      <GorgCard :padded="false" class="overflow-hidden">
      <div class="relative h-24 bg-linear-to-br from-tide-700 via-tide-500 to-ember-500 sm:h-36" aria-hidden="true">
        <div class="size-full bg-linear-to-t from-ink-950/30 via-transparent to-transparent" />
      </div>

      <div class="px-4 pb-5 sm:px-6">
        <!-- The avatar is the only thing allowed to sit over the cover band —
             text on that gradient would be a contrast problem at every width. -->
        <div class="-mt-10 sm:-mt-12">
          <span class="inline-flex rounded-pill ring-4 ring-[var(--surface-raised)]">
            <GorgAvatar :name="profile.name" size="xl" :status="profile.status" />
          </span>
        </div>

        <div class="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div class="min-w-0 flex-1 basis-56">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 class="text-xl font-semibold text-[var(--text-strong)] sm:text-2xl">
                {{ profile.name }}
              </h1>
              <span class="text-sm text-[var(--text-muted)]">{{ profile.pronouns }}</span>
              <GorgBadge tone="positive" size="xs" dot>Available</GorgBadge>
            </div>
            <p class="mt-1 text-sm text-[var(--text-strong)]">
              {{ profile.role }}
              <span class="text-[var(--text-muted)]">· {{ profile.team }}</span>
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <GorgButton size="sm" @click="toast.info(`Draft started to ${profile.name}`)">
              <template #lead>
                <Icon name="lucide:send" class="size-4" />
              </template>
              Message
            </GorgButton>

            <GorgButton
              :variant="following ? 'soft' : 'outline'"
              size="sm"
              :aria-pressed="following"
              @click="toggleFollow"
            >
              <template #lead>
                <Icon :name="following ? 'lucide:user-check' : 'lucide:user-plus'" class="size-4" />
              </template>
              {{ following ? 'Following' : 'Follow' }}
            </GorgButton>

            <GorgDropdown :items="more" heading="More">
              <template #trigger>
                <button
                  type="button"
                  aria-label="More profile actions"
                  class="grid size-9 place-items-center rounded-field border border-[var(--surface-border)] text-[var(--text-muted)]
                         transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]
                         dark:border-ink-700"
                >
                  <Icon name="lucide:ellipsis" class="size-4" />
                </button>
              </template>
            </GorgDropdown>
          </div>
        </div>

        <ul class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ profile.location }}</span>
          </li>
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:clock" class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ profile.timezone }}</span>
          </li>
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:calendar-days" class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">Joined {{ profile.joined }}</span>
          </li>
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:coffee" class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ profile.availability }}</span>
          </li>
        </ul>
        </div>
      </GorgCard>
    </div>

    <!-- Stats -->
    <div ref="statsEl" class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <GorgCard v-for="stat in profileStats" :key="stat.key" class="min-w-0">
        <div class="flex items-start gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
            <Icon :name="stat.icon" class="size-4" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="text-xl font-semibold tabular-nums text-[var(--text-strong)]">{{ stat.value }}</p>
            <p class="text-xs font-medium leading-snug text-[var(--text-strong)]">{{ stat.label }}</p>
            <p class="text-xs leading-snug text-[var(--text-muted)]">{{ stat.hint }}</p>
          </div>
        </div>
      </GorgCard>
    </div>

    <GorgTabs v-model="tab" :items="tabs" variant="underline" aria-label="Profile sections">
      <!-- Overview -->
      <template #overview>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div class="space-y-4">
            <GorgCard>
              <template #title>About</template>
              <div class="space-y-3">
                <p
                  v-for="(paragraph, index) in profile.bio"
                  :key="index"
                  class="text-sm leading-relaxed text-[var(--text-muted)]"
                >
                  {{ paragraph }}
                </p>
              </div>
            </GorgCard>

            <GorgCard>
              <template #title>Recent activity</template>
              <template #subtitle>The last month, newest first</template>

              <ol ref="activityEl" class="space-y-0">
                <li
                  v-for="(entry, index) in profileActivity"
                  :key="entry.id"
                  class="relative flex gap-3 pb-5 last:pb-0"
                >
                  <span
                    v-if="index < profileActivity.length - 1"
                    class="absolute start-4 top-9 bottom-0 w-px -translate-x-1/2 bg-[var(--surface-border)] rtl:translate-x-1/2"
                    aria-hidden="true"
                  />
                  <span
                    class="relative grid size-8 shrink-0 place-items-center rounded-pill"
                    :class="activityChip[entry.tone]"
                  >
                    <Icon :name="entry.icon" class="size-4" aria-hidden="true" />
                  </span>
                  <div class="min-w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium text-[var(--text-strong)]">{{ entry.title }}</p>
                    <p class="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{{ entry.detail }}</p>
                    <p class="mt-1 text-xs text-[var(--text-muted)]">
                      <time>{{ entry.at }}</time>
                    </p>
                  </div>
                </li>
              </ol>
            </GorgCard>
          </div>

          <div class="space-y-4">
            <GorgCard>
              <template #title>Skills</template>
              <template #subtitle>Grouped by how deep it goes</template>

              <div class="space-y-4">
                <div v-for="group in skillGroups" :key="group.depth">
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {{ group.label }}
                  </h4>
                  <ul class="flex flex-wrap gap-1.5">
                    <li v-for="skill in group.items" :key="skill.label">
                      <GorgBadge :tone="skillTone[skill.depth]" size="sm">
                        {{ skill.label }}
                        <span class="sr-only"> — {{ skillWord[skill.depth] }}</span>
                      </GorgBadge>
                    </li>
                  </ul>
                </div>
              </div>
            </GorgCard>

            <GorgCard>
              <template #title>Elsewhere</template>
              <ul class="space-y-1">
                <li v-for="link in profile.links" :key="link.label">
                  <a
                    :href="link.href"
                    class="flex items-center gap-2.5 rounded-field px-2 py-2 text-sm text-[var(--text-strong)]
                           transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
                  >
                    <Icon :name="link.icon" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                    <span class="min-w-0 truncate">{{ link.label }}</span>
                    <Icon name="lucide:arrow-up-right" class="ms-auto size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </GorgCard>
          </div>
        </div>
      </template>

      <!-- Projects -->
      <template #projects>
        <ul class="grid gap-3 sm:grid-cols-2">
          <li v-for="project in profileProjects" :key="project.id">
            <GorgCard class="h-full">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-xs text-[var(--text-muted)]">{{ project.id }}</p>
                  <h3 class="mt-0.5 truncate text-sm font-semibold text-[var(--text-strong)]">
                    {{ project.name }}
                  </h3>
                </div>
                <GorgBadge :tone="projectStatus[project.status].tone" size="xs" class="shrink-0">
                  <Icon :name="projectStatus[project.status].icon" class="size-3" aria-hidden="true" />
                  {{ projectStatus[project.status].label }}
                </GorgBadge>
              </div>

              <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{{ project.summary }}</p>

              <div class="mt-4">
                <GorgProgress
                  :value="project.progress"
                  :label="`${project.role} · progress`"
                  show-value
                  size="xs"
                  :tone="project.status === 'shipped' ? 'positive' : 'brand'"
                />
              </div>

              <template #footer>
                <div class="flex items-center justify-between gap-3">
                  <GorgAvatarGroup :people="project.members.map(name => ({ name }))" :max="3" size="xs" />
                  <GorgButton variant="ghost" size="xs" to="/layouts/record-detail">
                    Open
                    <template #trail>
                      <Icon name="lucide:arrow-right" class="size-3.5" />
                    </template>
                  </GorgButton>
                </div>
              </template>
            </GorgCard>
          </li>
        </ul>
      </template>

      <!-- Files -->
      <template #files>
        <GorgCard :padded="false" class="overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] p-4">
            <h3 class="text-sm font-semibold text-[var(--text-strong)]">Shared files</h3>
            <p class="text-xs text-[var(--text-muted)]">{{ profileFiles.length }} items · read-only</p>
          </div>

          <ul class="divide-y divide-[var(--surface-border)]">
            <li
              v-for="file in profileFiles"
              :key="file.id"
              class="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
            >
              <span class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                <Icon :name="file.icon" class="size-4" aria-hidden="true" />
              </span>

              <div class="min-w-0 flex-1 basis-40">
                <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ file.name }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ file.kind }} · {{ file.size }}</p>
              </div>

              <span class="shrink-0 text-xs text-[var(--text-muted)]">{{ file.at }}</span>

              <GorgButton variant="ghost" size="xs" :aria-label="`Download ${file.name}`">
                <Icon name="lucide:download" class="size-4" />
              </GorgButton>
            </li>
          </ul>
        </GorgCard>
      </template>
    </GorgTabs>
  </div>
</template>
