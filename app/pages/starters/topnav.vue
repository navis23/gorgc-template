<script setup lang="ts">
definePageMeta({ layout: 'topnav' })
useHead({ title: 'Topnav starter' })

const points = [
  { title: 'Full-width content', body: 'Nothing competes with the page for horizontal space.', icon: 'lucide:maximize' },
  { title: 'Drawer on mobile', body: 'The nav folds into an edge drawer below lg.', icon: 'lucide:menu' },
  { title: 'Fluid or contained', body: 'The fluid prop switches between a max-width and edge-to-edge.', icon: 'lucide:move-horizontal' },
]

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.06, y: 12 })
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-[var(--text-strong)]">Topnav starter</h1>
      <p class="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">Horizontal primary navigation with no sidebar. Best for shallow products where the content wants the full width.</p>
    </header>

    <div ref="grid" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <GorgCard v-for="p in points" :key="p.title">
        <div class="flex items-start gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200">
            <Icon :name="p.icon" class="size-4.5" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[var(--text-strong)]">{{ p.title }}</p>
            <p class="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{{ p.body }}</p>
          </div>
        </div>
      </GorgCard>
    </div>

    <GorgCard>
      <template #title>Swap the shell</template>
      <template #subtitle>Every gorg shell takes the same items prop and the same slot contract</template>
      <p class="text-sm leading-relaxed text-[var(--text-muted)]">
        Set <code class="rounded-[4px] bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-strong)]">definePageMeta({ layout: 'topnav' })</code>
        on a page and it renders in this shell. Because the contract is shared, the same
        navigation and toolbar work unchanged across all four.
      </p>
      <template #footer>
        <div class="flex flex-wrap gap-2">
          <GorgButton to="/starters/sidebar" variant="outline" size="sm">Sidebar</GorgButton>
          <GorgButton to="/starters/topnav" variant="outline" size="sm">Topnav</GorgButton>
          <GorgButton to="/starters/collapse" variant="outline" size="sm">Collapse</GorgButton>
          <GorgButton to="/starters/blank" variant="outline" size="sm">Blank</GorgButton>
        </div>
      </template>
    </GorgCard>
  </div>
</template>
