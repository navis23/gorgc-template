<script setup lang="ts">
import type { PresenceStatus, Team } from '~/utils/mock-collections'
import { directory, TEAMS } from '~/utils/mock-collections'

useHead({ title: 'Card grid' })

type Density = 'comfortable' | 'compact'

const query = ref('')
const team = ref<Team | 'all'>('all')
const density = ref<Density>('comfortable')

const counts = computed(() => {
  const map = new Map<Team | 'all', number>([['all', directory.length]])
  for (const t of TEAMS)
    map.set(t, directory.filter(p => p.team === t).length)
  return map
})

const people = computed(() => {
  const q = query.value.trim().toLowerCase()
  return directory.filter((p) => {
    if (team.value !== 'all' && p.team !== team.value)
      return false
    if (!q)
      return true
    return p.name.toLowerCase().includes(q)
      || p.role.toLowerCase().includes(q)
      || p.location.toLowerCase().includes(q)
      || p.email.toLowerCase().includes(q)
  })
})

/** Status is carried by a word and an icon as well as a tone. */
const presence: Record<PresenceStatus, {
  label: string
  icon: string
  tone: 'positive' | 'info' | 'caution' | 'neutral'
  dot: 'online' | 'busy' | 'away' | 'offline'
}> = {
  active: { label: 'Available', icon: 'lucide:circle-check', tone: 'positive', dot: 'online' },
  focus: { label: 'Heads down', icon: 'lucide:headphones', tone: 'info', dot: 'busy' },
  away: { label: 'Away', icon: 'lucide:clock', tone: 'caution', dot: 'away' },
  leave: { label: 'On leave', icon: 'lucide:palmtree', tone: 'neutral', dot: 'offline' },
}

const gridClass = computed(() => density.value === 'compact'
  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4')

const densities: Array<{ value: Density, label: string, icon: string }> = [
  { value: 'comfortable', label: 'Comfortable', icon: 'lucide:layout-grid' },
  { value: 'compact', label: 'Compact', icon: 'lucide:grid-3x3' },
]

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.035, y: 16 })

function reset() {
  query.value = ''
  team.value = 'all'
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Directory</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ people.length }} of {{ directory.length }} people
          <span v-if="team !== 'all'"> · {{ team }}</span>
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:user-plus" class="size-4" />
        </template>
        Invite people
      </GorgButton>
    </header>

    <!-- Toolbar: search, team chips, density. Wraps to its own rows on a phone. -->
    <div class="surface-card space-y-3 p-4 shadow-raise">
      <div class="flex flex-wrap items-center gap-3">
        <GorgInput
          v-model="query"
          placeholder="Search name, role, location…"
          icon="lucide:search"
          size="sm"
          clearable
          class="w-full sm:max-w-xs"
        />

        <div class="ms-auto flex items-center gap-1 rounded-pill bg-[var(--surface-sunken)] p-1" role="group" aria-label="Card density">
          <button
            v-for="d in densities"
            :key="d.value"
            type="button"
            :aria-pressed="density === d.value"
            class="inline-flex h-7 items-center gap-1.5 rounded-pill px-2.5 text-xs font-medium transition-colors duration-(--duration-snap)"
            :class="density === d.value
              ? 'bg-[var(--surface-raised)] text-[var(--text-strong)] shadow-raise'
              : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'"
            @click="density = d.value"
          >
            <Icon :name="d.icon" class="size-3.5" aria-hidden="true" />
            {{ d.label }}
          </button>
        </div>
      </div>

      <div class="-mx-1 flex flex-wrap gap-2 px-1">
        <button
          type="button"
          :aria-pressed="team === 'all'"
          class="inline-flex h-8 items-center gap-2 rounded-pill border px-3 text-xs font-medium transition-colors duration-(--duration-snap)"
          :class="team === 'all'
            ? 'border-tide-600 bg-tide-600 text-white'
            : 'border-[var(--surface-border)] text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
          @click="team = 'all'"
        >
          All teams
          <span class="tabular-nums opacity-70">{{ counts.get('all') }}</span>
        </button>

        <button
          v-for="t in TEAMS"
          :key="t"
          type="button"
          :aria-pressed="team === t"
          class="inline-flex h-8 items-center gap-2 rounded-pill border px-3 text-xs font-medium transition-colors duration-(--duration-snap)"
          :class="team === t
            ? 'border-tide-600 bg-tide-600 text-white'
            : 'border-[var(--surface-border)] text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
          @click="team = t"
        >
          {{ t }}
          <span class="tabular-nums opacity-70">{{ counts.get(t) }}</span>
        </button>
      </div>
    </div>

    <ul v-if="people.length" ref="grid" class="grid" :class="gridClass">
      <li v-for="person in people" :key="person.id">
        <article
          class="surface-card flex h-full flex-col shadow-raise transition-[box-shadow,transform] duration-(--duration-base)
                 hover:-translate-y-1 hover:shadow-float"
          :class="density === 'compact' ? 'p-3.5' : 'p-5'"
        >
          <div class="flex items-start gap-3">
            <GorgAvatar
              :name="person.name"
              :size="density === 'compact' ? 'sm' : 'md'"
              :status="presence[person.status].dot"
            />
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-semibold text-[var(--text-strong)]" :class="density === 'compact' ? 'text-sm' : 'text-[0.9375rem]'">
                {{ person.name }}
              </h2>
              <p class="truncate text-xs text-[var(--text-muted)]">{{ person.role }}</p>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <GorgBadge size="xs" tone="brand">{{ person.team }}</GorgBadge>
            <GorgBadge size="xs" :tone="presence[person.status].tone">
              <Icon :name="presence[person.status].icon" class="size-3" aria-hidden="true" />
              {{ presence[person.status].label }}
            </GorgBadge>
          </div>

          <dl class="mt-4 grid grid-cols-2 divide-x divide-[var(--surface-border)] rounded-field bg-[var(--surface-sunken)] py-2.5">
            <div class="px-3 text-center">
              <dt class="text-[11px] text-[var(--text-muted)]">Shipped</dt>
              <dd class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">{{ person.shipped }}</dd>
            </div>
            <div class="px-3 text-center">
              <dt class="text-[11px] text-[var(--text-muted)]">Reviews</dt>
              <dd class="text-sm font-semibold tabular-nums text-[var(--text-strong)]">{{ person.reviews }}</dd>
            </div>
          </dl>

          <footer
            v-if="density === 'comfortable'"
            class="mt-4 flex items-center justify-between gap-2 border-t border-[var(--surface-border)] pt-3"
          >
            <span class="inline-flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Icon name="lucide:map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ person.location }} · {{ person.tenure }}</span>
            </span>
            <GorgButton variant="ghost" size="xs" :aria-label="`Message ${person.name}`">
              <template #lead>
                <Icon name="lucide:send" class="size-3.5" />
              </template>
              Message
            </GorgButton>
          </footer>
        </article>
      </li>
    </ul>

    <GorgEmptyState
      v-else
      bordered
      icon="lucide:user-search"
      title="Nobody matches those filters"
      description="Loosen the search or pick a different team."
    >
      <template #action>
        <GorgButton size="sm" variant="outline" @click="reset">Clear filters</GorgButton>
      </template>
    </GorgEmptyState>
  </div>
</template>
