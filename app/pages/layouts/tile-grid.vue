<script setup lang="ts">
import type { Integration, IntegrationCategory } from '~/utils/mock-collections'
import { INTEGRATION_CATEGORIES, integrations } from '~/utils/mock-collections'

useHead({ title: 'Tile grid' })

/** Local copy — the switches write to this, never to the shared fixture. */
const apps = ref<Integration[]>(integrations.map(app => ({ ...app })))

const query = ref('')
const enabledOnly = ref(false)

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return apps.value.filter((app) => {
    if (enabledOnly.value && !app.enabled)
      return false
    if (!q)
      return true
    return app.name.toLowerCase().includes(q)
      || app.description.toLowerCase().includes(q)
      || app.category.toLowerCase().includes(q)
  })
})

interface Group { category: IntegrationCategory, apps: Integration[] }

const groups = computed<Group[]>(() =>
  INTEGRATION_CATEGORIES
    .map(category => ({ category, apps: matches.value.filter(a => a.category === category) }))
    .filter(group => group.apps.length > 0))

const enabledCount = computed(() => apps.value.filter(a => a.enabled).length)

const categoryIcons: Record<IntegrationCategory, string> = {
  Communication: 'lucide:messages-square',
  Developer: 'lucide:code-xml',
  Analytics: 'lucide:chart-no-axes-column',
  Finance: 'lucide:banknote',
  Storage: 'lucide:hard-drive',
}

const emptyTitle = computed(() => (query.value.trim()
  ? `No integration matches “${query.value.trim()}”`
  : 'Nothing to show with these filters'))

function reset() {
  query.value = ''
  enabledOnly.value = false
}

const board = useTemplateRef<HTMLElement>('board')
useStagger(board, { each: 0.08, y: 18 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Integrations</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ enabledCount }} of {{ apps.length }} enabled across {{ INTEGRATION_CATEGORIES.length }} categories.
        </p>
      </div>
      <GorgButton size="sm" variant="outline">
        <template #lead>
          <Icon name="lucide:store" class="size-4" />
        </template>
        Browse catalogue
      </GorgButton>
    </header>

    <div class="flex flex-wrap items-center gap-4">
      <GorgInput
        v-model="query"
        placeholder="Search every category…"
        icon="lucide:search"
        size="sm"
        clearable
        class="w-full sm:max-w-sm"
      />
      <GorgSwitch v-model="enabledOnly" size="sm" align="start" label="Enabled only" class="sm:ms-auto sm:w-auto" />
    </div>

    <div v-if="groups.length" ref="board" class="space-y-8">
      <section v-for="group in groups" :key="group.category">
        <header class="mb-3 flex items-center gap-2">
          <Icon :name="categoryIcons[group.category]" class="size-4 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 class="text-sm font-semibold text-[var(--text-strong)]">{{ group.category }}</h2>
          <span class="rounded-pill bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--text-muted)]">
            {{ group.apps.length }}
          </span>
        </header>

        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <li v-for="app in group.apps" :key="app.id">
            <div
              class="surface-card flex h-full items-start gap-3 p-4 shadow-raise
                     transition-[box-shadow,border-color] duration-(--duration-base) hover:shadow-float"
              :class="app.enabled && 'border-tide-300 dark:border-tide-800'"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-field transition-colors duration-(--duration-base)"
                :class="app.enabled
                  ? 'bg-tide-100 text-tide-700 dark:bg-tide-900/60 dark:text-tide-200'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'"
                aria-hidden="true"
              >
                <Icon :name="app.icon" class="size-5" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <GorgLabel :for="`app-${app.id}`" size="sm" class="cursor-pointer">
                    {{ app.name }}
                  </GorgLabel>
                  <GorgBadge v-if="app.note" size="xs" :tone="app.note === 'new' ? 'accent' : 'info'">
                    {{ app.note }}
                  </GorgBadge>
                </div>

                <p class="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{{ app.description }}</p>

                <!-- the word backs up the switch position and the tint -->
                <p
                  class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
                  :class="app.enabled ? 'text-[var(--color-positive)]' : 'text-[var(--text-muted)]'"
                >
                  <Icon
                    :name="app.enabled ? 'lucide:plug-zap' : 'lucide:unplug'"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ app.enabled ? 'Connected' : 'Not connected' }}
                </p>
              </div>

              <GorgSwitch :id="`app-${app.id}`" v-model="app.enabled" size="sm" />
            </div>
          </li>
        </ul>
      </section>
    </div>

    <GorgEmptyState
      v-else
      bordered
      icon="lucide:search-x"
      :title="emptyTitle"
      description="Nothing in any category matched. Try a shorter term, or clear the enabled-only filter."
    >
      <template #action>
        <GorgButton size="sm" variant="outline" @click="reset">Clear search</GorgButton>
      </template>
    </GorgEmptyState>
  </div>
</template>
