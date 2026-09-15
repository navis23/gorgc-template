<script setup lang="ts">
import type { FileNode } from '~/utils/mock-utility'
import { fileKindIcon, files as seed, formatBytes, storageBreakdown, storageUsed } from '~/utils/mock-utility'

useHead({ title: 'Files' })

const toast = useToast()
const items = ref<FileNode[]>(seed.map(f => ({ ...f })))
const query = ref('')
const view = ref<'grid' | 'list'>('grid')
const sortKey = ref<'name' | 'modified' | 'size'>('name')
const selected = ref<Set<number>>(new Set())

const kindTint: Record<string, string> = {
  folder: 'text-[var(--color-caution)] bg-[color-mix(in_oklch,var(--color-caution)_16%,transparent)]',
  doc: 'text-[var(--color-info)] bg-[color-mix(in_oklch,var(--color-info)_14%,transparent)]',
  sheet: 'text-[var(--color-positive)] bg-[color-mix(in_oklch,var(--color-positive)_14%,transparent)]',
  image: 'text-ember-700 bg-ember-100 dark:text-ember-200 dark:bg-ember-900/50',
  archive: 'text-[var(--text-muted)] bg-[var(--surface-sunken)]',
  code: 'text-tide-700 bg-tide-100 dark:text-tide-200 dark:bg-tide-900/50',
  pdf: 'text-[var(--color-critical)] bg-[color-mix(in_oklch,var(--color-critical)_14%,transparent)]',
}

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = items.value.filter(f => !q || f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q))
  return [...list].sort((a, b) => {
    // Folders always lead, whatever the sort.
    if ((a.kind === 'folder') !== (b.kind === 'folder'))
      return a.kind === 'folder' ? -1 : 1
    if (sortKey.value === 'size')
      return (b.size ?? 0) - (a.size ?? 0)
    if (sortKey.value === 'modified')
      return b.modified.localeCompare(a.modified)
    return a.name.localeCompare(b.name)
  })
})

function toggle(id: number) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}

function clearSelection() {
  selected.value = new Set()
}

function removeSelected() {
  const n = selected.value.size
  items.value = items.value.filter(f => !selected.value.has(f.id))
  clearSelection()
  toast.success(`${n} ${n === 1 ? 'item' : 'items'} moved to trash`)
}

function toggleStar(f: FileNode) {
  f.starred = !f.starred
}

const grid = useTemplateRef<HTMLElement>('grid')
useStagger(grid, { each: 0.03, y: 10 })

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Last modified', value: 'modified' },
  { label: 'Size', value: 'size' },
]
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Files</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ visible.length }} {{ visible.length === 1 ? 'item' : 'items' }} in this folder.
        </p>
      </div>
      <div class="flex gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:folder-plus" class="size-4" />
          </template>
          New folder
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:upload" class="size-4" />
          </template>
          Upload
        </GorgButton>
      </div>
    </header>

    <div class="grid gap-4 xl:grid-cols-[1fr_18rem]">
      <div class="min-w-0 space-y-4">
        <!-- toolbar -->
        <div class="flex flex-wrap items-center gap-3">
          <GorgInput v-model="query" placeholder="Search files…" icon="lucide:search" size="sm" clearable class="w-full sm:max-w-xs" />
          <GorgSelect v-model="sortKey" :items="sortOptions" size="sm" class="w-full sm:w-44" />
          <div class="ms-auto flex rounded-field border border-[var(--surface-border)] p-0.5">
            <button
              v-for="v in (['grid', 'list'] as const)" :key="v"
              type="button"
              class="rounded-[calc(var(--radius-field)-2px)] px-2.5 py-1.5 transition"
              :class="view === v ? 'bg-tide-600 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="view === v"
              :aria-label="`${v} view`"
              @click="view = v"
            >
              <Icon :name="v === 'grid' ? 'lucide:layout-grid' : 'lucide:list'" class="size-4" />
            </button>
          </div>
        </div>

        <!-- bulk bar -->
        <div
          v-if="selected.size"
          class="flex flex-wrap items-center gap-3 rounded-card border border-tide-200 bg-tide-50 p-3 dark:border-tide-800 dark:bg-tide-950/40"
        >
          <p class="text-sm font-medium text-tide-900 dark:text-tide-100">
            {{ selected.size }} selected
          </p>
          <div class="ms-auto flex gap-2">
            <GorgButton variant="ghost" size="xs" @click="clearSelection">Clear</GorgButton>
            <GorgButton variant="outline" size="xs">
              <template #lead><Icon name="lucide:download" class="size-3.5" /></template>
              Download
            </GorgButton>
            <GorgButton variant="danger" size="xs" @click="removeSelected">
              <template #lead><Icon name="lucide:trash-2" class="size-3.5" /></template>
              Delete
            </GorgButton>
          </div>
        </div>

        <!-- grid view -->
        <div v-if="view === 'grid' && visible.length" ref="grid" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="f in visible"
            :key="f.id"
            class="surface-card p-3 shadow-raise transition-[box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:shadow-float"
            :class="selected.has(f.id) && 'ring-2 ring-tide-500'"
          >
            <div class="flex items-start gap-2">
              <label class="flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="size-4 accent-tide-600"
                  :checked="selected.has(f.id)"
                  :aria-label="`Select ${f.name}`"
                  @change="toggle(f.id)"
                >
              </label>
              <span class="ms-auto">
                <GorgButton variant="ghost" size="xs" :aria-label="f.starred ? 'Unstar' : 'Star'" @click="toggleStar(f)">
                  <Icon name="lucide:star" class="size-3.5" :class="f.starred && 'text-[var(--color-caution)]'" />
                </GorgButton>
              </span>
            </div>

            <div class="mt-1 grid size-12 place-items-center rounded-field" :class="kindTint[f.kind]">
              <Icon :name="fileKindIcon[f.kind]" class="size-6" />
            </div>

            <p class="mt-3 truncate text-sm font-medium text-[var(--text-strong)]">{{ f.name }}</p>
            <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {{ f.kind === 'folder' ? `${f.items} items` : formatBytes(f.size) }} · {{ f.modified }}
            </p>
          </article>
        </div>

        <!-- list view -->
        <GorgCard v-else-if="visible.length" :padded="false">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[40rem] text-sm">
              <thead>
                <tr class="border-b border-[var(--surface-border)]">
                  <th scope="col" class="w-10 px-4 py-2.5" />
                  <th scope="col" class="px-2 py-2.5 text-start text-xs font-medium text-[var(--text-muted)]">Name</th>
                  <th scope="col" class="px-4 py-2.5 text-start text-xs font-medium text-[var(--text-muted)]">Owner</th>
                  <th scope="col" class="px-4 py-2.5 text-end text-xs font-medium text-[var(--text-muted)]">Size</th>
                  <th scope="col" class="px-4 py-2.5 text-start text-xs font-medium text-[var(--text-muted)]">Modified</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="f in visible"
                  :key="f.id"
                  class="border-b border-[var(--surface-border)] transition last:border-0 hover:bg-[var(--surface-sunken)]"
                  :class="selected.has(f.id) && 'bg-tide-50 dark:bg-tide-950/40'"
                >
                  <td class="px-4 py-2.5">
                    <input
                      type="checkbox"
                      class="size-4 accent-tide-600"
                      :checked="selected.has(f.id)"
                      :aria-label="`Select ${f.name}`"
                      @change="toggle(f.id)"
                    >
                  </td>
                  <td class="px-2 py-2.5">
                    <div class="flex items-center gap-2.5">
                      <span class="grid size-7 shrink-0 place-items-center rounded-field" :class="kindTint[f.kind]">
                        <Icon :name="fileKindIcon[f.kind]" class="size-4" />
                      </span>
                      <span class="truncate font-medium text-[var(--text-strong)]">{{ f.name }}</span>
                      <Icon v-if="f.starred" name="lucide:star" class="size-3.5 shrink-0 text-[var(--color-caution)]" aria-label="Starred" />
                    </div>
                  </td>
                  <td class="px-4 py-2.5 text-[var(--text-muted)]">{{ f.owner }}</td>
                  <td class="px-4 py-2.5 text-end tabular-nums text-[var(--text-muted)]">
                    {{ f.kind === 'folder' ? `${f.items} items` : formatBytes(f.size) }}
                  </td>
                  <td class="px-4 py-2.5 tabular-nums text-[var(--text-muted)]">{{ f.modified }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GorgCard>

        <GorgCard v-else>
          <GorgEmptyState icon="lucide:file-x" title="No files match" description="Try a different search term." />
        </GorgCard>
      </div>

      <!-- storage sidebar -->
      <div class="space-y-4">
        <GorgCard>
          <template #title>Storage</template>
          <template #subtitle>{{ storageUsed }}% of 500 GB used</template>
          <GorgProgress :value="storageUsed" size="sm" :tone="storageUsed > 80 ? 'critical' : 'brand'" />
          <ul class="mt-4 space-y-2">
            <li v-for="(b, i) in storageBreakdown" :key="b.name" class="flex items-center gap-2 text-xs">
              <span class="size-2.5 rounded-[3px]" :style="{ background: `var(--chart-${i + 1})` }" />
              <span class="text-[var(--text-muted)]">{{ b.name }}</span>
              <span class="ms-auto tabular-nums text-[var(--text-strong)]">{{ formatBytes(b.value) }}</span>
            </li>
          </ul>
        </GorgCard>

        <GorgCard>
          <template #title>Upload</template>
          <GorgFileDrop multiple title="Drop files here" hint="Up to 50 MB per file" />
        </GorgCard>
      </div>
    </div>
  </div>
</template>
