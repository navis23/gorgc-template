<script setup lang="ts">
import type { NotifyKind } from '~/utils/mock-utility'
import { notifications as seed } from '~/utils/mock-utility'

useHead({ title: 'Notifications' })

const toast = useToast()
const items = ref(seed.map(n => ({ ...n })))

const kindMeta: Record<NotifyKind, { icon: string, label: string, tone: string }> = {
  incident: { icon: 'lucide:siren', label: 'Incidents', tone: 'text-[var(--color-critical)] bg-[color-mix(in_oklch,var(--color-critical)_14%,transparent)]' },
  mention: { icon: 'lucide:at-sign', label: 'Mentions', tone: 'text-[var(--color-info)] bg-[color-mix(in_oklch,var(--color-info)_14%,transparent)]' },
  deploy: { icon: 'lucide:rocket', label: 'Deploys', tone: 'text-tide-700 bg-tide-100 dark:text-tide-200 dark:bg-tide-900/50' },
  billing: { icon: 'lucide:credit-card', label: 'Billing', tone: 'text-[var(--text-muted)] bg-[var(--surface-sunken)]' },
  access: { icon: 'lucide:key-round', label: 'Access', tone: 'text-[var(--color-caution)] bg-[color-mix(in_oklch,var(--color-caution)_18%,transparent)]' },
}

const kinds = Object.keys(kindMeta) as NotifyKind[]
const filter = ref<'all' | 'unread' | NotifyKind>('all')

const unread = computed(() => items.value.filter(n => !n.read).length)

const visible = computed(() => {
  if (filter.value === 'all')
    return items.value
  if (filter.value === 'unread')
    return items.value.filter(n => !n.read)
  return items.value.filter(n => n.kind === filter.value)
})

function markAll() {
  items.value.forEach(n => (n.read = true))
  toast.success('All notifications marked as read')
}

function toggleRead(id: number) {
  const n = items.value.find(i => i.id === id)
  if (n)
    n.read = !n.read
}

function dismiss(id: number) {
  const i = items.value.findIndex(n => n.id === id)
  if (i !== -1)
    items.value.splice(i, 1)
}

function resolve(id: number, approved: boolean) {
  const n = items.value.find(i => i.id === id)
  if (!n)
    return
  n.read = true
  n.actionable = false
  toast[approved ? 'success' : 'info'](approved ? `Approved: ${n.title}` : `Dismissed: ${n.title}`)
}

const list = useTemplateRef<HTMLElement>('list')
useStagger(list, { each: 0.04, y: 10 })

const counts = computed(() => {
  const map = {} as Record<NotifyKind, number>
  for (const k of kinds)
    map[k] = items.value.filter(n => n.kind === k).length
  return map
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Notifications</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ unread }} unread of {{ items.length }}.
        </p>
      </div>
      <GorgButton variant="outline" size="sm" :disabled="!unread" @click="markAll">
        <template #lead>
          <Icon name="lucide:check-check" class="size-4" />
        </template>
        Mark all read
      </GorgButton>
    </header>

    <div class="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <!-- filters -->
      <nav aria-label="Filter notifications">
        <ul class="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2 whitespace-nowrap rounded-field px-3 py-2 text-sm transition"
              :class="filter === 'all' ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="filter === 'all'"
              @click="filter = 'all'"
            >
              <Icon name="lucide:inbox" class="size-4" />
              All
              <span class="ms-auto text-xs tabular-nums">{{ items.length }}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2 whitespace-nowrap rounded-field px-3 py-2 text-sm transition"
              :class="filter === 'unread' ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="filter === 'unread'"
              @click="filter = 'unread'"
            >
              <Icon name="lucide:mail" class="size-4" />
              Unread
              <span class="ms-auto text-xs tabular-nums">{{ unread }}</span>
            </button>
          </li>
          <li v-for="k in kinds" :key="k">
            <button
              type="button"
              class="flex w-full items-center gap-2 whitespace-nowrap rounded-field px-3 py-2 text-sm transition"
              :class="filter === k ? 'bg-[var(--surface-sunken)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'"
              :aria-pressed="filter === k"
              @click="filter = k"
            >
              <Icon :name="kindMeta[k].icon" class="size-4" />
              {{ kindMeta[k].label }}
              <span class="ms-auto text-xs tabular-nums">{{ counts[k] }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- feed -->
      <GorgCard v-if="visible.length" :padded="false">
        <ul ref="list" class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="n in visible"
            :key="n.id"
            class="flex gap-3 p-4 transition"
            :class="!n.read && 'bg-tide-50/60 dark:bg-tide-950/30'"
          >
            <span class="grid size-9 shrink-0 place-items-center rounded-field" :class="kindMeta[n.kind].tone">
              <Icon :name="kindMeta[n.kind].icon" class="size-4.5" />
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-baseline gap-x-2">
                <p class="text-sm" :class="n.read ? 'font-medium text-[var(--text-strong)]' : 'font-semibold text-[var(--text-strong)]'">
                  {{ n.title }}
                </p>
                <span v-if="!n.read" class="inline-flex items-center gap-1 text-[11px] font-medium text-tide-600 dark:text-tide-300">
                  <span class="size-1.5 rounded-pill bg-tide-500" />New
                </span>
                <span class="ms-auto shrink-0 text-xs text-[var(--text-muted)]">{{ n.at }}</span>
              </div>

              <p class="mt-0.5 text-sm text-[var(--text-muted)]">{{ n.detail }}</p>

              <div v-if="n.actor" class="mt-2 flex items-center gap-2">
                <GorgAvatar :name="n.actor" size="xs" />
                <span class="text-xs text-[var(--text-muted)]">{{ n.actor }}</span>
              </div>

              <div v-if="n.actionable" class="mt-3 flex gap-2">
                <GorgButton size="xs" @click="resolve(n.id, true)">Approve</GorgButton>
                <GorgButton variant="outline" size="xs" @click="resolve(n.id, false)">Dismiss</GorgButton>
              </div>
            </div>

            <div class="flex shrink-0 flex-col gap-1">
              <GorgTooltip :text="n.read ? 'Mark unread' : 'Mark read'">
                <GorgButton variant="ghost" size="xs" :aria-label="n.read ? 'Mark unread' : 'Mark read'" @click="toggleRead(n.id)">
                  <Icon :name="n.read ? 'lucide:mail' : 'lucide:mail-open'" class="size-4" />
                </GorgButton>
              </GorgTooltip>
              <GorgTooltip text="Remove">
                <GorgButton variant="ghost" size="xs" aria-label="Remove" @click="dismiss(n.id)">
                  <Icon name="lucide:x" class="size-4" />
                </GorgButton>
              </GorgTooltip>
            </div>
          </li>
        </ul>
      </GorgCard>

      <GorgCard v-else>
        <GorgEmptyState
          icon="lucide:bell-off"
          title="Nothing here"
          description="You are all caught up on this filter."
        />
      </GorgCard>
    </div>
  </div>
</template>
