<script setup lang="ts">
useHead({ title: 'Layouts' })

interface Meta { title: string, description: string, icon: string, group: string }

/**
 * Hand-written metadata for the archetypes we know about. Anything else under
 * /layouts is still listed — derived from the router — so a page added later
 * shows up here without editing this map.
 */
const META: Record<string, Meta> = {
  'card-grid': { title: 'Card grid', description: 'People directory as filterable cards with a density toggle.', icon: 'lucide:layout-grid', group: 'Collections' },
  'project-grid': { title: 'Project grid', description: 'Project cards with progress, members and sorting.', icon: 'lucide:folder-kanban', group: 'Collections' },
  'list-view': { title: 'List view', description: 'Dense rows with multi-select and a bulk action bar.', icon: 'lucide:list', group: 'Collections' },
  'media-list': { title: 'Media list', description: 'Rich rows with thumbnails, tags and stat clusters.', icon: 'lucide:rows-3', group: 'Collections' },
  'tile-grid': { title: 'Tile grid', description: 'Integration launcher with per-tile toggles and search.', icon: 'lucide:grid-2x2', group: 'Collections' },

  'profile': { title: 'Profile', description: 'Read-only person view with tabbed sections.', icon: 'lucide:user', group: 'Records' },
  'profile-edit': { title: 'Profile edit', description: 'Sectioned form with a sticky save bar and validation.', icon: 'lucide:user-pen', group: 'Records' },
  'record-detail': { title: 'Record detail', description: 'Two-column record with comments and a metadata sidebar.', icon: 'lucide:file-text', group: 'Records' },
  'invoice': { title: 'Invoice', description: 'Line items, totals and a payment status timeline.', icon: 'lucide:receipt', group: 'Records' },
  'pricing': { title: 'Pricing', description: 'Plan tiers, a billing-period switch and a comparison table.', icon: 'lucide:badge-dollar-sign', group: 'Records' },

  'calendar': { title: 'Calendar', description: 'Month, week and agenda views with type filters.', icon: 'lucide:calendar', group: 'Utility' },
  'notifications': { title: 'Notifications', description: 'Filterable feed with read state and inline actions.', icon: 'lucide:bell', group: 'Utility' },
  'file-manager': { title: 'File manager', description: 'Grid and list browsing with selection and storage meter.', icon: 'lucide:folder', group: 'Utility' },
  'search': { title: 'Search', description: 'Faceted results with match highlighting and sorting.', icon: 'lucide:search', group: 'Utility' },
}

const router = useRouter()

const entries = computed(() => router.getRoutes()
  .map(r => r.path)
  .filter(p => p.startsWith('/layouts/') && !p.includes(':'))
  .map(p => p.replace('/layouts/', ''))
  .filter((p, i, a) => p && a.indexOf(p) === i)
  .map(slug => ({
    slug,
    to: `/layouts/${slug}`,
    ...(META[slug] ?? {
      title: slug.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()),
      description: 'Layout page.',
      icon: 'lucide:layout-template',
      group: 'Other',
    }),
  }))
  .sort((a, b) => a.title.localeCompare(b.title)))

const groups = computed(() => {
  const order = ['Collections', 'Records', 'Utility', 'Other']
  const map = new Map<string, typeof entries.value>()
  for (const e of entries.value) {
    const list = map.get(e.group) ?? []
    list.push(e)
    map.set(e.group, list)
  }
  return order.filter(g => map.has(g)).map(g => ({ name: g, items: map.get(g)! }))
})

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { selector: 'a', each: 0.04, y: 12 })
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Layouts</h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        {{ entries.length }} page archetypes, each composed from the gorg component library.
      </p>
    </header>

    <div ref="grid" class="space-y-6">
    <section v-for="group in groups" :key="group.name" class="space-y-3">
      <h2 class="text-sm font-semibold text-[var(--text-muted)]">{{ group.name }}</h2>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="e in group.items"
          :key="e.slug"
          :to="e.to"
          class="surface-card block p-4 shadow-raise transition-[box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:shadow-float"
        >
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-field bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200">
              <Icon :name="e.icon" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-[var(--text-strong)]">{{ e.title }}</p>
              <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ e.description }}</p>
            </div>
            <Icon name="lucide:arrow-up-right" class="size-4 shrink-0 text-[var(--text-muted)]" />
          </div>
        </NuxtLink>
      </div>
    </section>
    </div>

    <GorgEmptyState v-if="!entries.length" icon="lucide:layout-template" title="No layout pages yet" />
  </div>
</template>
