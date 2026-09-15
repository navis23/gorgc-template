<script setup lang="ts">
import type { GorgDropdownItem } from '~/components/nav/nav'
import type { LinkedItem, RecordComment } from '~/utils/mock-records'
import { linkedItems, milestones, record, recordComments } from '~/utils/mock-records'

useHead({ title: `${record.id} · ${record.title}` })

const toast = useToast()

/* ---- milestones --------------------------------------------------------- */

const steps = ref(milestones.map(step => ({ ...step })))

const doneCount = computed(() => steps.value.filter(step => step.done).length)
const progress = computed(() => Math.round((doneCount.value / steps.value.length) * 100))

function onToggle(id: string) {
  const step = steps.value.find(candidate => candidate.id === id)
  if (!step)
    return
  toast.info(step.done ? `“${step.label}” marked done` : `“${step.label}” reopened`)
}

/* ---- comments ----------------------------------------------------------- */

const comments = ref<RecordComment[]>(recordComments.map(comment => ({ ...comment })))
const draft = ref('')
const posting = ref(false)
const me = 'Noor Abdel-Rahim'

// Seeded from the fixture so ids stay stable between server and client.
let nextId = comments.value.reduce((max, comment) => Math.max(max, comment.id), 0)

const canPost = computed(() => draft.value.trim().length > 1)

async function post() {
  if (!canPost.value)
    return

  posting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  comments.value.push({
    id: ++nextId,
    author: me,
    role: 'Staff Design Engineer',
    body: draft.value.trim(),
    at: 'Just now',
  })

  draft.value = ''
  posting.value = false
  toast.success('Comment posted')
}

/* ---- metadata ----------------------------------------------------------- */

const statusOptions = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'In progress', value: 'in progress' },
  { label: 'In review', value: 'in review' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Done', value: 'done' },
]

const status = ref<string>(record.status)

const statusMeta: Record<string, { tone: 'neutral' | 'brand' | 'info' | 'critical' | 'positive', icon: string }> = {
  'backlog': { tone: 'neutral', icon: 'lucide:circle-dashed' },
  'in progress': { tone: 'brand', icon: 'lucide:circle-dot' },
  'in review': { tone: 'info', icon: 'lucide:eye' },
  'blocked': { tone: 'critical', icon: 'lucide:octagon-x' },
  'done': { tone: 'positive', icon: 'lucide:circle-check' },
}

const current = computed(() => statusMeta[status.value] ?? statusMeta.backlog!)

watch(status, value => toast.info(`Status set to “${value}”`))

const priorityMeta = {
  low: { tone: 'neutral' as const, icon: 'lucide:chevron-down' },
  medium: { tone: 'info' as const, icon: 'lucide:minus' },
  high: { tone: 'caution' as const, icon: 'lucide:chevron-up' },
  urgent: { tone: 'critical' as const, icon: 'lucide:chevrons-up' },
}

const linkState: Record<LinkedItem['state'], { tone: 'neutral' | 'brand' | 'positive' | 'info', label: string }> = {
  open: { tone: 'info', label: 'Open' },
  merged: { tone: 'brand', label: 'Merged' },
  closed: { tone: 'neutral', label: 'Closed' },
  draft: { tone: 'neutral', label: 'Draft' },
}

const actions: GorgDropdownItem[] = [
  { label: 'Duplicate record', icon: 'lucide:copy' },
  { label: 'Move to project…', icon: 'lucide:folder-input' },
  { label: 'Export as Markdown', icon: 'lucide:download' },
  { separator: true },
  { label: 'Archive', icon: 'lucide:archive', onSelect: () => toast.warning('Record archived') },
]

const archiveOpen = ref(false)
const deleteOpen = ref(false)

function doDelete() {
  deleteOpen.value = false
  toast.error(`${record.id} deleted`, { title: 'Gone' })
}

const stepsEl = useTemplateRef<HTMLElement>('stepsEl')
const commentsEl = useTemplateRef<HTMLElement>('commentsEl')
const sideEl = useTemplateRef<HTMLElement>('sideEl')

useStagger(stepsEl, { each: 0.05, y: 10 })
useStagger(commentsEl, { each: 0.06, y: 14 })
useStagger(sideEl, { each: 0.06, y: 12 })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-xs text-[var(--text-muted)]">{{ record.id }}</span>
          <GorgBadge :tone="current.tone" size="xs">
            <Icon :name="current.icon" class="size-3" aria-hidden="true" />
            {{ status }}
          </GorgBadge>
          <GorgBadge :tone="priorityMeta[record.priority].tone" size="xs" variant="outline">
            <Icon :name="priorityMeta[record.priority].icon" class="size-3" aria-hidden="true" />
            {{ record.priority }} priority
          </GorgBadge>
        </div>
        <h1 class="mt-1.5 text-xl font-semibold text-[var(--text-strong)] sm:text-2xl">
          {{ record.title }}
        </h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">{{ record.subtitle }}</p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <GorgButton variant="outline" size="sm" @click="toast.info('Watching this record')">
          <template #lead>
            <Icon name="lucide:bell" class="size-4" />
          </template>
          Watch
        </GorgButton>
        <GorgButton size="sm" @click="toast.info('Opening the editor…')">
          <template #lead>
            <Icon name="lucide:pencil" class="size-4" />
          </template>
          Edit
        </GorgButton>
        <GorgDropdown :items="actions" heading="Record actions">
          <template #trigger>
            <button
              type="button"
              aria-label="More record actions"
              class="grid size-9 place-items-center rounded-field border border-[var(--surface-border)] text-[var(--text-muted)]
                     transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]
                     dark:border-ink-700"
            >
              <Icon name="lucide:ellipsis" class="size-4" />
            </button>
          </template>
        </GorgDropdown>
      </div>
    </header>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
      <!-- Main column -->
      <div class="min-w-0 space-y-4">
        <GorgCard>
          <template #title>Description</template>
          <div class="space-y-3">
            <p
              v-for="(paragraph, index) in record.description"
              :key="index"
              class="text-sm leading-relaxed text-[var(--text-muted)]"
            >
              {{ paragraph }}
            </p>
          </div>
        </GorgCard>

        <!-- Milestones -->
        <GorgCard>
          <template #title>Milestones</template>
          <template #subtitle>{{ doneCount }} of {{ steps.length }} complete</template>
          <template #header>
            <span class="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-strong)]">{{ progress }}%</span>
          </template>

          <GorgProgress
            :value="progress"
            size="sm"
            :tone="progress === 100 ? 'positive' : 'brand'"
            class="mb-4"
          />

          <ul ref="stepsEl" class="divide-y divide-[var(--surface-border)]">
            <li v-for="step in steps" :key="step.id" class="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
              <GorgCheckbox
                v-model="step.done"
                size="md"
                class="min-w-0 flex-1 basis-48"
                @update:model-value="onToggle(step.id)"
              >
                <span :class="step.done && 'line-through opacity-70'">{{ step.label }}</span>
                <template #description>
                  {{ step.detail }}
                </template>
              </GorgCheckbox>

              <div class="flex shrink-0 items-center gap-2 ps-8 sm:ps-0">
                <GorgTooltip :text="`Owner: ${step.owner}`">
                  <span><GorgAvatar :name="step.owner" size="xs" /></span>
                </GorgTooltip>
                <span class="whitespace-nowrap text-xs text-[var(--text-muted)]">
                  <span class="sr-only">Due </span>{{ step.due }}
                </span>
              </div>
            </li>
          </ul>
        </GorgCard>

        <!-- Comments -->
        <GorgCard>
          <template #title>Discussion</template>
          <template #subtitle>{{ comments.length }} comments</template>

          <ol ref="commentsEl" class="space-y-4">
            <li v-for="comment in comments" :key="comment.id" class="flex gap-3">
              <GorgAvatar :name="comment.author" size="sm" class="mt-0.5" />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span class="text-sm font-semibold text-[var(--text-strong)]">{{ comment.author }}</span>
                  <span class="text-xs text-[var(--text-muted)]">{{ comment.role }}</span>
                  <GorgBadge v-if="comment.pinned" tone="accent" size="xs">
                    <Icon name="lucide:pin" class="size-3" aria-hidden="true" />
                    Pinned
                  </GorgBadge>
                </div>

                <div class="mt-1.5 rounded-card bg-[var(--surface-sunken)] px-3.5 py-3">
                  <p class="text-sm leading-relaxed text-[var(--text-strong)]">{{ comment.body }}</p>
                </div>

                <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <time class="text-xs text-[var(--text-muted)]">{{ comment.at }}</time>
                  <button
                    type="button"
                    class="rounded-field text-xs font-medium text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]"
                    @click="draft = `@${comment.author.split(' ')[0]} `"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    class="rounded-field text-xs font-medium text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]"
                    @click="toast.info('Reaction added')"
                  >
                    React
                  </button>
                </div>
              </div>
            </li>
          </ol>

          <template #footer>
            <form class="flex gap-3" @submit.prevent="post">
              <GorgAvatar :name="me" size="sm" class="mt-0.5 hidden sm:inline-flex" />

              <div class="min-w-0 flex-1 space-y-2">
                <GorgFormGroup label="Add a comment">
                  <template #label>
                    <span class="sr-only">Add a comment</span>
                  </template>
                  <GorgTextarea
                    v-model="draft"
                    :rows="3"
                    auto-resize
                    :maxlength="1200"
                    placeholder="Leave a note for the team…"
                  />
                </GorgFormGroup>

                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs text-[var(--text-muted)]">
                    Markdown is supported. Mention someone with @.
                  </p>
                  <GorgButton type="submit" size="sm" :loading="posting" :disabled="!canPost">
                    <template #lead>
                      <Icon name="lucide:send-horizontal" class="size-4" />
                    </template>
                    Comment
                  </GorgButton>
                </div>
              </div>
            </form>
          </template>
        </GorgCard>
      </div>

      <!-- Metadata sidebar -->
      <aside ref="sideEl" class="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1" aria-label="Record metadata">
        <GorgCard>
          <template #title>Details</template>

          <dl class="space-y-4 text-sm">
            <div>
              <dt class="text-xs font-medium text-[var(--text-muted)]">Owner</dt>
              <dd class="mt-1.5 flex items-center gap-2">
                <GorgAvatar :name="record.owner.name" size="xs" />
                <span class="min-w-0">
                  <span class="block truncate text-sm text-[var(--text-strong)]">{{ record.owner.name }}</span>
                  <span class="block truncate text-xs text-[var(--text-muted)]">{{ record.owner.role }}</span>
                </span>
              </dd>
            </div>

            <div>
              <dt class="text-xs font-medium text-[var(--text-muted)]">Reported by</dt>
              <dd class="mt-1.5 flex items-center gap-2">
                <GorgAvatar :name="record.reporter.name" size="xs" />
                <span class="min-w-0 truncate text-sm text-[var(--text-strong)]">{{ record.reporter.name }}</span>
              </dd>
            </div>

            <div>
              <GorgFormGroup label="Status" help="Changing this notifies the watchers.">
                <GorgSelect v-model="status" :items="statusOptions" size="sm" />
              </GorgFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-[var(--surface-border)] pt-4">
              <div>
                <dt class="text-xs font-medium text-[var(--text-muted)]">Created</dt>
                <dd class="mt-0.5 text-sm text-[var(--text-strong)]">{{ record.created }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-[var(--text-muted)]">Due</dt>
                <dd class="mt-0.5 text-sm text-[var(--text-strong)]">{{ record.due }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs font-medium text-[var(--text-muted)]">Last updated</dt>
                <dd class="mt-0.5 text-sm text-[var(--text-strong)]">{{ record.updated }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-xs font-medium text-[var(--text-muted)]">Estimate</dt>
                <dd class="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--text-strong)]">
                  <Icon name="lucide:hourglass" class="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                  {{ record.estimate }}
                </dd>
              </div>
            </div>
          </dl>
        </GorgCard>

        <GorgCard>
          <template #title>Tags</template>
          <ul class="flex flex-wrap gap-1.5">
            <li v-for="tag in record.tags" :key="tag">
              <GorgBadge tone="neutral" size="sm">#{{ tag }}</GorgBadge>
            </li>
          </ul>

          <template #footer>
            <div class="flex items-center justify-between gap-3">
              <span class="min-w-0 text-xs text-[var(--text-muted)]">Watchers</span>
              <GorgAvatarGroup :people="record.watchers.map(name => ({ name }))" :max="4" size="xs" />
            </div>
          </template>
        </GorgCard>

        <GorgCard :padded="false">
          <div class="p-5 pb-3">
            <h3 class="text-sm font-semibold text-[var(--text-strong)]">Linked items</h3>
          </div>
          <ul class="divide-y divide-[var(--surface-border)] border-t border-[var(--surface-border)]">
            <li v-for="item in linkedItems" :key="item.id">
              <a
                href="#"
                class="flex items-start gap-2.5 px-5 py-3 transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
              >
                <Icon :name="item.icon" class="mt-0.5 size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm text-[var(--text-strong)]">{{ item.label }}</span>
                  <span class="mt-0.5 flex items-center gap-1.5">
                    <span class="font-mono text-xs text-[var(--text-muted)]">{{ item.id }}</span>
                    <GorgBadge :tone="linkState[item.state].tone" size="xs" dot>
                      {{ linkState[item.state].label }}
                    </GorgBadge>
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </GorgCard>

        <GorgCard class="border-[color-mix(in_oklch,var(--color-critical)_30%,var(--surface-border))]">
          <template #title>Danger zone</template>
          <p class="text-xs leading-relaxed text-[var(--text-muted)]">
            Archiving keeps the history and hides the record from boards. Deleting removes it and its
            {{ comments.length }} comments for everyone.
          </p>
          <template #footer>
            <div class="flex flex-wrap gap-2">
              <GorgButton variant="outline" size="sm" @click="archiveOpen = true">Archive</GorgButton>
              <GorgButton variant="danger" size="sm" @click="deleteOpen = true">Delete record</GorgButton>
            </div>
          </template>
        </GorgCard>
      </aside>
    </div>

    <GorgModal
      v-model:open="archiveOpen"
      title="Archive this record?"
      description="It leaves every board and search result, but nothing is lost. You can restore it from the archive at any time."
      size="sm"
    >
      <template #footer="{ close }">
        <GorgButton variant="ghost" size="sm" @click="close()">Cancel</GorgButton>
        <GorgButton size="sm" @click="archiveOpen = false; toast.warning(`${record.id} archived`)">
          Archive
        </GorgButton>
      </template>
    </GorgModal>

    <GorgModal
      v-model:open="deleteOpen"
      :title="`Delete ${record.id}?`"
      description="This removes the record, its milestones and its whole discussion. It cannot be undone."
      size="sm"
    >
      <GorgAlert tone="critical" title="Five people are watching this record">
        They will lose access to the discussion immediately and will not be notified.
      </GorgAlert>

      <template #footer="{ close }">
        <GorgButton variant="ghost" size="sm" @click="close()">Keep it</GorgButton>
        <GorgButton variant="danger" size="sm" @click="doDelete">Delete permanently</GorgButton>
      </template>
    </GorgModal>
  </div>
</template>
