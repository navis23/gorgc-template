<script setup lang="ts">
import type { MsgBubble, MsgConversation } from '~/utils/mock-comms'
import { formatCompact, groupInt } from '~/utils/chart'
import { dayLabel, demoDate, isoDay, relativeLabel, shortDayLabel, timeLabel } from '~/utils/datetime'
import { msgConversations, msgPulse, msgThreads } from '~/utils/mock-comms'

useHead({ title: 'Messaging' })

/* -- local, mutable copy ---------------------------------------------------
   The fixture is module-scope and shared; clone it so marking a conversation
   read here never leaks into another page's render. */
const conversations = ref<MsgConversation[]>(msgConversations.map(c => ({ ...c })))

/** Replies typed in this session, appended to the fixture thread on read. */
const sent = reactive<Record<string, MsgBubble[]>>({})

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.06 })

/* -- filters ------------------------------------------------------------- */
type Bucket = 'all' | 'unread' | 'assigned' | 'resolved'

const bucket = ref<Bucket>('all')

const counts = computed(() => ({
  all: conversations.value.length,
  unread: conversations.value.filter(c => c.unread > 0).length,
  assigned: conversations.value.filter(c => c.state === 'assigned').length,
  resolved: conversations.value.filter(c => c.state === 'resolved').length,
}))

const bucketItems = computed(() => [
  { value: 'all', label: `All ${counts.value.all}` },
  { value: 'unread', label: `Unread ${counts.value.unread}` },
  { value: 'assigned', label: `Assigned ${counts.value.assigned}` },
  { value: 'resolved', label: `Resolved ${counts.value.resolved}` },
])

// `bucket` is a narrowed union but GorgSegmented models a plain string, so the
// proxy converts at the boundary instead of widening the state everywhere.
const bucketModel = computed<string>({
  get: () => bucket.value,
  set: v => { bucket.value = v as Bucket },
})

const { query, visible, isEmpty, isFiltered } = useCollection(conversations, {
  search: (c, q) =>
    c.subject.toLowerCase().includes(q)
    || c.preview.toLowerCase().includes(q)
    || c.person.name.toLowerCase().includes(q)
    || c.person.company.toLowerCase().includes(q),
  filters: {
    bucket: (c) => {
      if (bucket.value === 'unread')
        return c.unread > 0
      if (bucket.value === 'assigned')
        return c.state === 'assigned'
      if (bucket.value === 'resolved')
        return c.state === 'resolved'
      return true
    },
  },
  pageSize: 0,
})

/* -- selection ------------------------------------------------------------ */
const selectedId = ref<string>(conversations.value[0]?.id ?? '')
const selected = computed(() => conversations.value.find(c => c.id === selectedId.value) ?? null)

// Keep the reading pane on something real when the list narrows under it.
watch(visible, (list) => {
  if (!list.some(c => c.id === selectedId.value))
    selectedId.value = list[0]?.id ?? ''
})

/* -- panes ----------------------------------------------------------------
   Below `lg` only one pane is on screen at a time and this switch reaches the
   other two. From `lg` the list and thread sit side by side with the context
   panel beneath the thread. Only at `2xl` is there room for all three abreast —
   splitting three ways at `xl` leaves the thread itself under 460px. */
type Pane = 'list' | 'thread' | 'context'
const pane = ref<Pane>('list')
const paneModel = computed<string>({
  get: () => pane.value,
  set: v => { pane.value = v as Pane },
})
const paneItems = [
  { value: 'list', label: 'Conversations', icon: 'lucide:list' },
  { value: 'thread', label: 'Thread', icon: 'lucide:message-square' },
  { value: 'context', label: 'Details', icon: 'lucide:panel-right' },
]

function open(c: MsgConversation) {
  selectedId.value = c.id
  c.unread = 0
  pane.value = 'thread'
}

/* -- thread, grouped by day ----------------------------------------------- */
const TODAY = isoDay(0)
const YESTERDAY = isoDay(-1)

function dayHeading(date: Date): string {
  const iso = isoDay(date)
  if (iso === TODAY)
    return 'Today'
  if (iso === YESTERDAY)
    return 'Yesterday'
  return dayLabel(date)
}

interface BubbleDay {
  iso: string
  heading: string
  items: MsgBubble[]
}

const thread = computed<MsgBubble[]>(() => {
  const id = selectedId.value
  if (!id)
    return []
  return [...(msgThreads[id] ?? []), ...(sent[id] ?? [])]
})

const threadDays = computed<BubbleDay[]>(() => {
  const map = new Map<string, BubbleDay>()
  for (const b of thread.value) {
    const iso = isoDay(b.at)
    let group = map.get(iso)
    if (!group) {
      group = { iso, heading: dayHeading(b.at), items: [] }
      map.set(iso, group)
    }
    group.items.push(b)
  }
  return [...map.values()].sort((a, b) => (a.iso < b.iso ? -1 : 1))
})

/* -- composer ------------------------------------------------------------- */
const composer = ref('')
// Each sent reply lands a minute after the last, from the fixed demo epoch —
// never `new Date()`, which would differ between the server and the browser.
const replyMinute = ref(0)

function send() {
  const body = composer.value.trim()
  const conversation = selected.value
  if (!body || !conversation)
    return

  replyMinute.value += 1
  const list = sent[conversation.id] ?? (sent[conversation.id] = [])
  list.push({
    id: `local-${conversation.id}-${replyMinute.value}`,
    author: 'Wren Adeyemi',
    body,
    at: demoDate(0, 9, 45 + replyMinute.value),
    outgoing: true,
    state: 'sent',
  })
  conversation.preview = body
  composer.value = ''
}

function onComposerKeydown(event: KeyboardEvent) {
  // ⌘/Ctrl + Enter sends; a bare Enter keeps its newline.
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    send()
  }
}

/* -- actions -------------------------------------------------------------- */
function toggleResolved(c: MsgConversation) {
  c.state = c.state === 'resolved' ? 'assigned' : 'resolved'
}

function claim(c: MsgConversation) {
  c.assignee = 'Wren Adeyemi'
  c.state = 'assigned'
}

/* -- presentation maps ---------------------------------------------------- */
const channelIcon: Record<string, string> = {
  Chat: 'lucide:message-circle',
  Email: 'lucide:mail',
  Support: 'lucide:life-buoy',
  Voice: 'lucide:phone',
}

const stateMeta = {
  'open': { tone: 'caution' as const, icon: 'lucide:circle-dot', label: 'Open' },
  'assigned': { tone: 'info' as const, icon: 'lucide:user-check', label: 'Assigned' },
  'resolved': { tone: 'positive' as const, icon: 'lucide:check-check', label: 'Resolved' },
}

const fileIcon: Record<string, string> = {
  pdf: 'lucide:file-text',
  image: 'lucide:image',
  sheet: 'lucide:table-2',
  archive: 'lucide:file-archive',
  doc: 'lucide:file',
}

const deliveryIcon = {
  sent: 'lucide:check',
  delivered: 'lucide:check-check',
  read: 'lucide:check-check',
}

/** Same-day conversations show a clock, older ones show a date. */
function listStamp(at: Date): string {
  return isoDay(at) === TODAY ? timeLabel(at) : shortDayLabel(at)
}

const messageCount = computed(() => thread.value.length)
const totalUnread = computed(() => conversations.value.reduce((a, c) => a + c.unread, 0))
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Messaging</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          One queue for customer and team conversations —
          {{ totalUnread }} unread across {{ counts.all }} threads.
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <GorgButton variant="outline" size="sm">
          <template #lead>
            <Icon name="lucide:users" class="size-4" />
          </template>
          Team view
        </GorgButton>
        <GorgButton size="sm">
          <template #lead>
            <Icon name="lucide:pen-line" class="size-4" />
          </template>
          New message
        </GorgButton>
      </div>
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Open conversations"
        :value="msgPulse.openConversations"
        :delta="msgPulse.openDelta"
        icon="lucide:messages-square"
        invert
        :sparkline="msgPulse.openTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Awaiting our reply"
        :value="msgPulse.awaitingReply"
        :delta="msgPulse.awaitingDelta"
        icon="lucide:clock-alert"
        invert
        :sparkline="msgPulse.awaitingTrend"
        :format="n => groupInt(n)"
      />
      <GorgStatTile
        label="Median first reply"
        :value="msgPulse.medianFirstReply"
        :delta="msgPulse.firstReplyDelta"
        icon="lucide:timer"
        invert
        :decimals="1"
        :sparkline="msgPulse.firstReplyTrend"
        :format="n => `${n.toFixed(1)} min`"
      />
      <GorgStatTile
        label="Resolved today"
        :value="msgPulse.resolvedToday"
        :delta="msgPulse.resolvedDelta"
        icon="lucide:circle-check-big"
        :sparkline="msgPulse.resolvedTrend"
        :format="n => groupInt(n)"
      />
    </div>

    <div class="space-y-3">
      <!-- The queue filter scopes every pane, so it sits above all three. -->
      <div class="overflow-x-auto pb-0.5">
        <GorgSegmented
          v-model="bucketModel"
          :items="bucketItems"
          aria-label="Conversation filter"
        />
      </div>

      <!-- Phone: one pane at a time, the other two a tap away. -->
      <GorgSegmented
        v-model="paneModel"
        :items="paneItems"
        variant="soft"
        grow
        aria-label="Messaging pane"
        class="lg:hidden"
      />
    </div>

    <div
      class="grid gap-4
             lg:grid-cols-[15rem_minmax(0,1fr)]
             2xl:grid-cols-[17rem_minmax(0,1fr)_18rem]"
    >
      <!-- ── pane 1 · conversations ─────────────────────────────────── -->
      <div
        class="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:block lg:self-start 2xl:row-span-1"
        :class="pane === 'list' ? '' : 'hidden'"
      >
        <GorgCard :padded="false" class="overflow-hidden">
          <div class="border-b border-[var(--surface-border)] p-3">
            <GorgInput
              v-model="query"
              placeholder="Search people, subjects…"
              icon="lucide:search"
              size="sm"
              clearable
            />
          </div>

          <ul
            v-if="!isEmpty"
            class="max-h-[26rem] divide-y divide-[var(--surface-border)] overflow-y-auto lg:max-h-[36rem]"
          >
            <li v-for="c in visible" :key="c.id">
              <button
                type="button"
                class="w-full px-3 py-3 text-start transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
                :class="c.id === selectedId && 'bg-[var(--surface-sunken)]'"
                :aria-current="c.id === selectedId ? 'true' : undefined"
                @click="open(c)"
              >
                <div class="flex items-start gap-2.5">
                  <GorgAvatar
                    :name="c.person.name"
                    size="sm"
                    :status="c.person.presence"
                  />

                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline gap-2">
                      <p
                        class="min-w-0 flex-1 truncate text-sm text-[var(--text-strong)]"
                        :class="c.unread > 0 && 'font-semibold'"
                      >
                        {{ c.person.name }}
                      </p>
                      <span class="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                        {{ listStamp(c.at) }}
                      </span>
                    </div>

                    <p class="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Icon :name="channelIcon[c.channel] ?? 'lucide:message-circle'" class="size-3 shrink-0" aria-hidden="true" />
                      <span class="truncate">{{ c.subject }}</span>
                    </p>

                    <p class="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                      {{ c.preview }}
                    </p>

                    <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <GorgBadge :tone="stateMeta[c.state].tone" size="xs">
                        <Icon :name="stateMeta[c.state].icon" class="size-3" aria-hidden="true" />
                        {{ stateMeta[c.state].label }}
                      </GorgBadge>
                      <GorgBadge v-if="c.unread > 0" tone="brand" variant="solid" size="xs">
                        {{ c.unread }} new
                      </GorgBadge>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          </ul>

          <GorgEmptyState
            v-else
            size="sm"
            icon="lucide:search-x"
            title="No conversations"
            :description="isFiltered
              ? 'Nothing matches that search in this filter.'
              : 'This filter is empty right now.'"
          />
        </GorgCard>
      </div>

      <!-- ── pane 2 · open thread ───────────────────────────────────── -->
      <div
        class="min-w-0 lg:col-start-2 lg:row-start-1 lg:block"
        :class="pane === 'thread' ? '' : 'hidden'"
      >
        <GorgCard v-if="selected" :padded="false" class="flex flex-col overflow-hidden">
          <!-- thread header -->
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--surface-border)] p-4">
            <div class="flex min-w-0 items-start gap-3">
              <GorgAvatar :name="selected.person.name" size="md" :status="selected.person.presence" />
              <div class="min-w-0">
                <h2 class="truncate text-sm font-semibold text-[var(--text-strong)]">
                  {{ selected.subject }}
                </h2>
                <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--text-muted)]">
                  <span class="truncate">{{ selected.person.name }}</span>
                  <span aria-hidden="true">·</span>
                  <span class="truncate">{{ selected.person.company }}</span>
                  <span aria-hidden="true">·</span>
                  <Icon :name="channelIcon[selected.channel] ?? 'lucide:message-circle'" class="size-3" aria-hidden="true" />
                  <span>{{ selected.channel }}</span>
                </p>
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <GorgButton
                v-if="selected.assignee === 'Unassigned'"
                variant="outline"
                size="xs"
                @click="claim(selected)"
              >
                <template #lead>
                  <Icon name="lucide:user-plus" class="size-3.5" />
                </template>
                Assign to me
              </GorgButton>
              <GorgButton
                :variant="selected.state === 'resolved' ? 'soft' : 'outline'"
                size="xs"
                :aria-pressed="selected.state === 'resolved'"
                @click="toggleResolved(selected)"
              >
                <template #lead>
                  <Icon
                    :name="selected.state === 'resolved' ? 'lucide:rotate-ccw' : 'lucide:check'"
                    class="size-3.5"
                  />
                </template>
                {{ selected.state === 'resolved' ? 'Reopen' : 'Resolve' }}
              </GorgButton>
              <GorgButton
                variant="ghost"
                size="xs"
                class="2xl:hidden"
                aria-label="Show conversation details"
                @click="pane = 'context'"
              >
                <Icon name="lucide:panel-right" class="size-4" />
              </GorgButton>
            </div>
          </div>

          <!-- messages -->
          <div class="max-h-[30rem] space-y-5 overflow-y-auto p-4 lg:max-h-[34rem]">
            <section v-for="day in threadDays" :key="day.iso" class="space-y-3">
              <!-- day separator -->
              <div class="flex items-center gap-3" role="separator" :aria-label="day.heading">
                <span class="h-px flex-1 bg-[var(--surface-border)]" aria-hidden="true" />
                <time
                  :datetime="day.iso"
                  class="shrink-0 rounded-pill bg-[var(--surface-sunken)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]"
                >{{ day.heading }}</time>
                <span class="h-px flex-1 bg-[var(--surface-border)]" aria-hidden="true" />
              </div>

              <div
                v-for="b in day.items"
                :key="b.id"
                class="flex items-end gap-2"
                :class="b.outgoing ? 'flex-row-reverse' : ''"
              >
                <GorgAvatar :name="b.author" size="xs" class="mb-4" />

                <div class="min-w-0 max-w-[85%] sm:max-w-[75%]">
                  <div
                    class="rounded-card px-3 py-2 text-sm"
                    :class="b.internal
                      ? 'border border-dashed border-[var(--color-caution)] bg-[color-mix(in_oklch,var(--color-caution)_10%,transparent)] text-[var(--text-strong)]'
                      : b.outgoing
                        ? 'bg-tide-600 text-white'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-strong)]'"
                  >
                    <p
                      v-if="b.internal"
                      class="mb-1 flex items-center gap-1 text-[11px] font-semibold tracking-wide text-[var(--color-caution)] uppercase"
                    >
                      <Icon name="lucide:lock" class="size-3" aria-hidden="true" />
                      Internal note
                    </p>
                    <p class="leading-relaxed whitespace-pre-line">{{ b.body }}</p>

                    <a
                      v-if="b.attachment"
                      href="#"
                      class="mt-2 flex items-center gap-2 rounded-field px-2 py-1.5 text-xs transition-colors duration-(--duration-snap)"
                      :class="b.outgoing && !b.internal
                        ? 'bg-tide-700/60 text-tide-50 hover:bg-tide-700'
                        : 'bg-[var(--surface-raised)] text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]'"
                      @click.prevent
                    >
                      <Icon name="lucide:paperclip" class="size-3.5 shrink-0" aria-hidden="true" />
                      <span class="min-w-0 flex-1 truncate">{{ b.attachment.name }}</span>
                      <span class="shrink-0 tabular-nums opacity-80">{{ b.attachment.size }}</span>
                    </a>
                  </div>

                  <p
                    class="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]"
                    :class="b.outgoing ? 'justify-end' : ''"
                  >
                    <span>{{ b.author }}</span>
                    <span aria-hidden="true">·</span>
                    <time :datetime="b.at.toISOString()" class="tabular-nums">{{ timeLabel(b.at) }}</time>
                    <template v-if="b.outgoing && b.state">
                      <Icon
                        :name="b.state ? deliveryIcon[b.state] : 'lucide:check'"
                        class="size-3.5"
                        :class="b.state === 'read' ? 'text-tide-600 dark:text-tide-300' : ''"
                        aria-hidden="true"
                      />
                      <span class="sr-only">{{ b.state }}</span>
                    </template>
                  </p>
                </div>
              </div>
            </section>
          </div>

          <!-- composer -->
          <div class="border-t border-[var(--surface-border)] p-3">
            <label for="messaging-composer" class="sr-only">Reply to this conversation</label>
            <GorgTextarea
              id="messaging-composer"
              v-model="composer"
              :rows="2"
              auto-resize
              :max-height="180"
              placeholder="Write a reply…"
              @keydown="onComposerKeydown"
            />
            <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <GorgButton variant="ghost" size="xs" aria-label="Attach a file">
                  <Icon name="lucide:paperclip" class="size-4" />
                </GorgButton>
                <GorgButton variant="ghost" size="xs" aria-label="Insert a saved reply">
                  <Icon name="lucide:message-square-quote" class="size-4" />
                </GorgButton>
                <GorgButton variant="ghost" size="xs" aria-label="Add an internal note">
                  <Icon name="lucide:lock" class="size-4" />
                </GorgButton>
              </div>
              <div class="flex items-center gap-2">
                <p class="hidden items-center gap-1 text-[11px] text-[var(--text-muted)] sm:flex">
                  <GorgKbd :keys="['⌘', '↵']" /> to send
                </p>
                <GorgButton size="sm" :disabled="!composer.trim()" @click="send">
                  <template #lead>
                    <Icon name="lucide:send" class="size-4" />
                  </template>
                  Send
                </GorgButton>
              </div>
            </div>
          </div>
        </GorgCard>

        <GorgCard v-else>
          <GorgEmptyState
            icon="lucide:message-square-dashed"
            title="No conversation open"
            description="Pick a thread from the list to read it here."
          />
        </GorgCard>
      </div>

      <!-- ── pane 3 · context ───────────────────────────────────────── -->
      <div
        class="min-w-0 lg:col-start-2 lg:row-start-2 lg:block 2xl:col-start-3 2xl:row-start-1"
        :class="pane === 'context' ? '' : 'hidden'"
      >
        <div class="grid content-start gap-4 lg:grid-cols-2 2xl:grid-cols-1">
          <template v-if="selected">
            <GorgCard>
              <template #title>
                Participant
              </template>

              <div class="flex items-center gap-3">
                <GorgAvatar :name="selected.person.name" size="lg" :status="selected.person.presence" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[var(--text-strong)]">
                    {{ selected.person.name }}
                  </p>
                  <p class="truncate text-xs text-[var(--text-muted)]">{{ selected.person.role }}</p>
                  <p class="mt-1 truncate text-xs text-[var(--text-muted)]">{{ selected.person.company }}</p>
                </div>
              </div>

              <dl class="mt-4 space-y-2.5 text-xs">
                <div class="flex items-start gap-2">
                  <dt class="flex w-20 shrink-0 items-center gap-1.5 text-[var(--text-muted)]">
                    <Icon name="lucide:mail" class="size-3.5" aria-hidden="true" />
                    Email
                  </dt>
                  <dd class="min-w-0 flex-1 truncate text-[var(--text-strong)]">{{ selected.person.email }}</dd>
                </div>
                <div class="flex items-start gap-2">
                  <dt class="flex w-20 shrink-0 items-center gap-1.5 text-[var(--text-muted)]">
                    <Icon name="lucide:globe" class="size-3.5" aria-hidden="true" />
                    Zone
                  </dt>
                  <dd class="min-w-0 flex-1 text-[var(--text-strong)]">
                    {{ selected.person.zone }}
                    <span class="tabular-nums text-[var(--text-muted)]">· {{ selected.person.localTime }} local</span>
                  </dd>
                </div>
                <div class="flex items-start gap-2">
                  <dt class="flex w-20 shrink-0 items-center gap-1.5 text-[var(--text-muted)]">
                    <Icon name="lucide:user-check" class="size-3.5" aria-hidden="true" />
                    Owner
                  </dt>
                  <dd class="min-w-0 flex-1 truncate text-[var(--text-strong)]">{{ selected.assignee }}</dd>
                </div>
              </dl>

              <div class="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--surface-border)] pt-4">
                <div class="min-w-0">
                  <p class="text-xs text-[var(--text-muted)]">First reply</p>
                  <p class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                    {{ selected.firstReplyMins }} min
                  </p>
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-[var(--text-muted)]">Messages</p>
                  <p class="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                    {{ groupInt(messageCount) }}
                  </p>
                </div>
              </div>
            </GorgCard>

            <GorgCard v-if="selected.watchers.length">
              <template #title>
                Also on this thread
              </template>
              <ul class="space-y-3">
                <li v-for="w in selected.watchers" :key="w.name" class="flex items-center gap-2.5">
                  <GorgAvatar :name="w.name" size="sm" />
                  <div class="min-w-0">
                    <p class="truncate text-sm text-[var(--text-strong)]">{{ w.name }}</p>
                    <p class="truncate text-xs text-[var(--text-muted)]">{{ w.role }}</p>
                  </div>
                </li>
              </ul>
            </GorgCard>

            <GorgCard>
              <template #title>
                Shared files
              </template>
              <template #subtitle>
                {{ selected.files.length }} attached to this conversation
              </template>

              <ul v-if="selected.files.length" class="-mx-1 divide-y divide-[var(--surface-border)]">
                <li v-for="f in selected.files" :key="f.id" class="flex items-center gap-2.5 px-1 py-2.5 first:pt-0 last:pb-0">
                  <span class="grid size-8 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                    <Icon :name="fileIcon[f.kind] ?? 'lucide:file'" class="size-4" aria-hidden="true" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-[var(--text-strong)]">{{ f.name }}</p>
                    <p class="truncate text-xs text-[var(--text-muted)]">
                      {{ f.size }} · {{ f.by }} · {{ relativeLabel(f.sharedDay) }}
                    </p>
                  </div>
                  <GorgButton variant="ghost" size="xs" :aria-label="`Download ${f.name}`">
                    <Icon name="lucide:download" class="size-4" />
                  </GorgButton>
                </li>
              </ul>
              <GorgEmptyState v-else size="sm" icon="lucide:paperclip" title="No files yet" />
            </GorgCard>

            <GorgCard class="min-w-0">
              <template #title>
                Labels
              </template>
              <div class="flex flex-wrap gap-1.5">
                <GorgBadge v-for="l in selected.labels" :key="l" tone="brand" variant="outline" size="xs">
                  <Icon name="lucide:tag" class="size-3" aria-hidden="true" />
                  {{ l }}
                </GorgBadge>
                <GorgBadge v-if="!selected.labels.length" size="xs">None</GorgBadge>
              </div>

              <div class="mt-4 border-t border-[var(--surface-border)] pt-4">
                <p class="text-xs text-[var(--text-muted)]">Reply volume on this account</p>
                <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                  {{ formatCompact(msgPulse.resolvedToday * 31) }} messages this quarter
                </p>
                <GorgSparkline :data="msgPulse.resolvedTrend" :height="40" class="mt-2" />
              </div>
            </GorgCard>
          </template>

          <GorgCard v-else>
            <GorgEmptyState size="sm" icon="lucide:panel-right" title="Nothing selected" />
          </GorgCard>
        </div>
      </div>
    </div>
  </div>
</template>
