<script setup lang="ts">
import type { Thread } from '~/utils/mock'
import { threads as seed } from '~/utils/mock'

useHead({ title: 'Inbox' })

const items = ref<Thread[]>(seed.map(t => ({ ...t })))
const query = ref('')
const folder = ref<'inbox' | 'archived'>('inbox')
const selectedId = ref<number | null>(items.value[0]?.id ?? null)

const folders = [
  { key: 'inbox' as const, label: 'Inbox', icon: 'lucide:inbox' },
  { key: 'archived' as const, label: 'Archived', icon: 'lucide:archive' },
]

const tagTone = {
  incident: 'critical',
  review: 'info',
  billing: 'neutral',
  hiring: 'brand',
} as const

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value
    .filter(t => t.label === folder.value)
    .filter(t => !q
      || t.subject.toLowerCase().includes(q)
      || t.from.toLowerCase().includes(q)
      || t.preview.toLowerCase().includes(q))
})

const selected = computed(() => items.value.find(t => t.id === selectedId.value) ?? null)
const unreadCount = computed(() => items.value.filter(t => t.label === 'inbox' && t.unread).length)

function open(t: Thread) {
  selectedId.value = t.id
  t.unread = false
}

function toggleStar(t: Thread) {
  t.starred = !t.starred
}

function archive(t: Thread) {
  t.label = t.label === 'inbox' ? 'archived' : 'inbox'
  if (selectedId.value === t.id)
    selectedId.value = visible.value[0]?.id ?? null
}

// Keep the reading pane on something real when the list changes under it.
watch(visible, (list) => {
  if (!list.some(t => t.id === selectedId.value))
    selectedId.value = list[0]?.id ?? null
})

const listEl = useTemplateRef<HTMLElement>('listEl')
useStagger(listEl, { each: 0.04, y: 10 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Inbox</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ unreadCount }} unread {{ unreadCount === 1 ? 'message' : 'messages' }}.
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:pen-line" class="size-4" />
        </template>
        Compose
      </GorgButton>
    </header>

    <div class="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <!-- list pane -->
      <GorgCard :padded="false" class="overflow-hidden">
        <div class="space-y-3 border-b border-[var(--surface-border)] p-3">
          <GorgInput v-model="query" placeholder="Search mail…" icon="lucide:search" size="sm" clearable />
          <nav class="flex gap-1" aria-label="Mail folders">
            <button
              v-for="f in folders"
              :key="f.key"
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-field px-2 py-1.5 text-xs font-medium transition"
              :class="folder === f.key
                ? 'bg-tide-100 text-tide-800 dark:bg-tide-900/50 dark:text-tide-100'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-current="folder === f.key ? 'true' : undefined"
              @click="folder = f.key"
            >
              <Icon :name="f.icon" class="size-3.5" />
              {{ f.label }}
            </button>
          </nav>
        </div>

        <ul v-if="visible.length" ref="listEl" class="max-h-[32rem] divide-y divide-[var(--surface-border)] overflow-y-auto">
          <li v-for="t in visible" :key="t.id">
            <button
              type="button"
              class="w-full px-3 py-3 text-start transition hover:bg-[var(--surface-sunken)]"
              :class="t.id === selectedId && 'bg-[var(--surface-sunken)]'"
              :aria-current="t.id === selectedId ? 'true' : undefined"
              @click="open(t)"
            >
              <div class="flex items-start gap-2">
                <span
                  class="mt-1.5 size-1.5 shrink-0 rounded-pill"
                  :class="t.unread ? 'bg-tide-500' : 'bg-transparent'"
                  :aria-label="t.unread ? 'Unread' : undefined"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-2">
                    <p
                      class="min-w-0 flex-1 truncate text-sm"
                      :class="t.unread ? 'font-semibold text-[var(--text-strong)]' : 'text-[var(--text-strong)]'"
                    >{{ t.from }}</p>
                    <span class="shrink-0 text-[11px] text-[var(--text-muted)]">{{ t.at }}</span>
                  </div>
                  <p class="truncate text-xs font-medium text-[var(--text-strong)]">{{ t.subject }}</p>
                  <p class="truncate text-xs text-[var(--text-muted)]">{{ t.preview }}</p>
                  <GorgBadge v-if="t.tag" :tone="tagTone[t.tag]" size="xs" class="mt-1.5">
                    {{ t.tag }}
                  </GorgBadge>
                </div>
              </div>
            </button>
          </li>
        </ul>

        <GorgEmptyState
          v-else
          icon="lucide:mail-x"
          title="Nothing here"
          :description="query ? 'No messages match your search.' : 'This folder is empty.'"
          size="sm"
        />
      </GorgCard>

      <!-- reading pane -->
      <GorgCard v-if="selected" :key="selected.id">
        <template #header>
          <div class="flex gap-1">
            <GorgTooltip :text="selected.starred ? 'Unstar' : 'Star'">
              <GorgButton variant="ghost" size="xs" :aria-label="selected.starred ? 'Unstar' : 'Star'" @click="toggleStar(selected)">
                <Icon :name="selected.starred ? 'lucide:star' : 'lucide:star'" class="size-4" :class="selected.starred && 'text-[var(--color-caution)]'" />
              </GorgButton>
            </GorgTooltip>
            <GorgTooltip :text="selected.label === 'inbox' ? 'Archive' : 'Move to inbox'">
              <GorgButton variant="ghost" size="xs" aria-label="Archive" @click="archive(selected)">
                <Icon name="lucide:archive" class="size-4" />
              </GorgButton>
            </GorgTooltip>
          </div>
        </template>

        <div class="flex items-start gap-3">
          <GorgAvatar :name="selected.from" size="md" />
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-[var(--text-strong)]">{{ selected.subject }}</h2>
            <p class="mt-0.5 text-sm text-[var(--text-muted)]">
              {{ selected.from }} · {{ selected.at }}
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-3 border-t border-[var(--surface-border)] pt-5">
          <p v-for="(para, i) in selected.body" :key="i" class="text-sm leading-relaxed text-[var(--text-strong)]">
            {{ para }}
          </p>
        </div>

        <template #footer>
          <div class="space-y-3">
            <GorgTextarea :rows="3" placeholder="Write a reply…" />
            <div class="flex gap-2">
              <GorgButton size="sm">Send reply</GorgButton>
              <GorgButton variant="ghost" size="sm">Save draft</GorgButton>
            </div>
          </div>
        </template>
      </GorgCard>

      <GorgCard v-else>
        <GorgEmptyState icon="lucide:mail-open" title="No message selected" description="Pick a thread from the list." />
      </GorgCard>
    </div>
  </div>
</template>
