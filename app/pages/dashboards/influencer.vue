<script setup lang="ts">
import type { InfCampaignStatus, InfPostKind } from '~/utils/mock-media'
import { formatCompact, formatCurrency, groupInt, slotColor } from '~/utils/chart'
import { relativeLabel } from '~/utils/datetime'
import {
  INF_DAYS,
  infAgeBands,
  infCampaigns,
  infDayLabels,
  infEarningsWeekly,
  infEngagementRate,
  infPlatformIndex,
  infPlatforms,
  infPostKindMeta,
  infPosts,
  infPulse,
  infReachDaily,
  infTopCountries,
} from '~/utils/mock-media'

useHead({ title: 'Creator analytics' })

const tiles = useTemplateRef<HTMLElement>('tiles')
useStagger(tiles, { each: 0.05 })

const platformGrid = useTemplateRef<HTMLElement>('platformGrid')
useStagger(platformGrid, { each: 0.06 })

const lower = useTemplateRef<HTMLElement>('lower')
useStagger(lower, { each: 0.08 })

const campaignPanel = useTemplateRef<HTMLElement>('campaignPanel')
useReveal(campaignPanel, { y: 14 })

/* -- range ----------------------------------------------------------------
   The window genuinely reslices the collected history — the chart, the
   per-platform sparklines and the "net added" line all move together. */
const RANGES = [14, 30, 90] as const
const rangeKey = ref('30')
const range = computed(() => Number(rangeKey.value))
const rangeItems = RANGES.map(r => ({ value: String(r), label: `${r}d` }))

function tail<T>(arr: T[], n: number): T[] {
  return arr.slice(-n)
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

const labels = computed(() => tail(infDayLabels, range.value))

/* Growth WITHIN the window, not the absolute base.
   Four absolute follower counts on one axis put a 412k line beside an 88k line
   and every one of them reads as flat — growth, the thing being asked about, is
   a rounding error at that scale. Cumulative net adds from the start of the
   window start every platform at zero, keep the unit identical across series
   (so one axis stays honest) and make the window genuinely legible. The
   absolute counts live on the platform cards, where they belong. */
function cumulate(steps: number[]): number[] {
  let acc = 0
  return steps.map((n) => {
    acc += n
    return acc
  })
}

const growth = computed(() => infPlatforms.map(p => ({
  name: p.name,
  data: cumulate(tail(p.netNew, range.value)),
})))

const netAdded = computed(() =>
  infPlatforms.reduce((total, p) => total + sum(tail(p.netNew, range.value)), 0))

/** Combined follower curve — the headline tile's sparkline. */
const combined = computed(() =>
  infDayLabels.map((_, i) => infPlatforms.reduce((a, p) => a + (p.history[i] ?? 0), 0)))

/* -- posts ----------------------------------------------------------------
   Decorated once at setup from module-scope fixtures, so search and sort work
   on real fields rather than on a formatter's output. */
const decorated = infPosts.map(p => ({
  ...p,
  rate: infEngagementRate(p),
  interactions: p.likes + p.comments + p.shares + p.saves,
  platformName: infPlatforms[infPlatformIndex(p.platform)]!.name,
}))

const {
  query,
  sortKey,
  sortDirection,
  visible: posts,
  total: postCount,
  isFiltered,
  reset,
} = useCollection(decorated, {
  searchFields: ['title', 'platformName'],
  initialSort: 'rate',
  initialDirection: 'desc',
  pageSize: 0,
})

/** The segmented control writes the sort; biggest-first is always what is meant. */
const sortBy = computed({
  get: () => sortKey.value ?? 'rate',
  set: (value: string) => {
    sortKey.value = value
    sortDirection.value = 'desc'
  },
})

const sortItems = [
  { value: 'rate', label: 'Engagement' },
  { value: 'reach', label: 'Reach' },
  { value: 'day', label: 'Newest' },
]

const peakRate = Math.max(...decorated.map(p => p.rate))

/* -- campaigns ------------------------------------------------------------ */

const campaignMeta: Record<InfCampaignStatus, {
  label: string
  icon: string
  tone: 'positive' | 'info' | 'neutral' | 'critical'
}> = {
  'live': { label: 'Running', icon: 'lucide:circle-play', tone: 'positive' },
  'in-review': { label: 'In review', icon: 'lucide:eye', tone: 'info' },
  'scheduled': { label: 'Scheduled', icon: 'lucide:calendar-clock', tone: 'neutral' },
  'at-risk': { label: 'Behind', icon: 'lucide:triangle-alert', tone: 'critical' },
}

const contracted = infCampaigns.reduce((a, c) => a + c.fee, 0)
const outstanding = infCampaigns.reduce((a, c) => a + (c.deliverables - c.delivered), 0)

/* -- audience ------------------------------------------------------------- */

const ageSeries = [{ name: 'Share of audience', data: infAgeBands.map(b => b.share) }]
const ageLabels = infAgeBands.map(b => b.label)

/* -- formatters ----------------------------------------------------------- */

const pct = (n: number) => `${n.toFixed(1)}%`
const rate = (n: number) => `${(n * 100).toFixed(1)}%`
const money = (n: number) => formatCurrency(n, 0)
const kindOf = (k: string) => infPostKindMeta[k as InfPostKind]
const dwell = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Creator analytics</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ groupInt(infPulse.followers) }} followers across {{ infPlatforms.length }} platforms,
          resliced from {{ INF_DAYS }} days of history.
        </p>
      </div>

      <GorgSegmented
        v-model="rangeKey"
        :items="rangeItems"
        variant="pill"
        aria-label="Date range"
        class="shrink-0"
      />
    </header>

    <div ref="tiles" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GorgStatTile
        label="Followers"
        :value="infPulse.followers"
        :delta="infPulse.followersDelta"
        icon="lucide:users"
        :format="n => formatCompact(n)"
        :sparkline="tail(combined, range)"
      />
      <GorgStatTile
        label="Engagement rate"
        :value="infPulse.engagement"
        :delta="infPulse.engagementDelta"
        :decimals="1"
        icon="lucide:heart"
        :format="pct"
      />
      <GorgStatTile
        label="Accounts reached"
        :value="infPulse.reach"
        :delta="infPulse.reachDelta"
        icon="lucide:radar"
        :format="n => formatCompact(n)"
        :sparkline="tail(infReachDaily, range)"
      />
      <GorgStatTile
        label="Earnings this month"
        :value="infPulse.earnings"
        :delta="infPulse.earningsDelta"
        icon="lucide:banknote"
        :format="money"
        :sparkline="infEarningsWeekly"
      />
    </div>

    <GorgCard class="min-w-0">
      <GorgChartFrame
        title="Follower growth"
        :subtitle="`Followers added since the start of the window · +${groupInt(netAdded)} across all platforms`"
        :series="growth"
        :labels="labels"
        :height="300"
      >
        <GorgLineChart
          :series="growth"
          :labels="labels"
          :height="300"
          :show-markers="range <= 30"
          :format="n => formatCompact(n)"
        />
      </GorgChartFrame>
    </GorgCard>

    <!-- one chart slot per platform, and it is the same slot everywhere else -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-sm font-semibold text-[var(--text-strong)]">Performance by platform</h2>
        <p class="text-xs text-[var(--text-muted)]">Net adds over the last {{ range }} days</p>
      </div>

      <div ref="platformGrid" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GorgCard v-for="(p, i) in infPlatforms" :key="p.id" class="min-w-0">
          <div class="flex items-start gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-field"
              :style="{
                background: `color-mix(in oklch, ${slotColor(i)} 16%, transparent)`,
                color: slotColor(i),
              }"
              aria-hidden="true"
            >
              <Icon :name="p.icon" class="size-5" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-[var(--text-strong)]">{{ p.name }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">{{ p.handle }}</p>
            </div>
          </div>

          <p class="mt-3 text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
            {{ formatCompact(p.followers) }}
          </p>
          <p
            class="mt-1 inline-flex items-center gap-1 text-xs font-medium"
            :class="p.followersDelta >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-critical)]'"
          >
            <Icon
              :name="p.followersDelta >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'"
              class="size-3.5"
              aria-hidden="true"
            />
            {{ p.followersDelta >= 0 ? '+' : '' }}{{ (p.followersDelta * 100).toFixed(1) }}%
            <span class="font-normal text-[var(--text-muted)]">in 30d</span>
          </p>

          <GorgSparkline
            :data="cumulate(tail(p.netNew, range))"
            :color="slotColor(i)"
            :height="40"
            class="mt-3"
          />

          <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--surface-border)] pt-3 text-xs">
            <div class="min-w-0">
              <dt class="text-[var(--text-muted)]">Engagement</dt>
              <dd class="mt-0.5 font-medium tabular-nums text-[var(--text-strong)]">{{ rate(p.engagement) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[var(--text-muted)]">Reach 30d</dt>
              <dd class="mt-0.5 font-medium tabular-nums text-[var(--text-strong)]">{{ formatCompact(p.reach) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[var(--text-muted)]">Posts</dt>
              <dd class="mt-0.5 font-medium tabular-nums text-[var(--text-strong)]">{{ p.posts }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[var(--text-muted)]">Median dwell</dt>
              <dd class="mt-0.5 font-medium tabular-nums text-[var(--text-strong)]">{{ dwell(p.dwellSeconds) }}</dd>
            </div>
          </dl>
        </GorgCard>
      </div>
    </section>

    <div ref="lower" class="grid gap-4 lg:grid-cols-3">
      <!-- top posts -->
      <GorgCard :padded="false" class="min-w-0 lg:col-span-2">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Top posts</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ postCount }} of {{ infPosts.length }} posts · engagement is interactions per account reached
            </p>
          </div>

          <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <GorgInput
              v-model="query"
              size="sm"
              icon="lucide:search"
              placeholder="Post or platform"
              clearable
              aria-label="Search posts"
              class="w-full sm:w-56"
            />
            <GorgSegmented v-model="sortBy" :items="sortItems" size="sm" aria-label="Sort posts by" />
          </div>
        </div>

        <ul v-if="posts.length" class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="post in posts"
            :key="post.id"
            class="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors duration-(--duration-snap)
                   hover:bg-[var(--surface-sunken)]"
          >
            <!-- thumbnail block: a tinted slot colour and a glyph, never a remote image -->
            <span
              class="relative grid size-12 shrink-0 place-items-center rounded-field text-lg font-semibold"
              :style="{
                background: `color-mix(in oklch, ${slotColor(infPlatformIndex(post.platform))} 18%, transparent)`,
                color: slotColor(infPlatformIndex(post.platform)),
              }"
              aria-hidden="true"
            >
              {{ post.glyph }}
              <span
                class="absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-pill
                       bg-[var(--surface-raised)] text-[var(--text-muted)] ring-1 ring-[var(--surface-border)]"
              >
                <Icon :name="kindOf(post.kind).icon" class="size-3" />
              </span>
            </span>

            <div class="min-w-0 flex-1 basis-40">
              <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ post.title }}</p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
                <span class="inline-flex items-center gap-1">
                  <span
                    class="size-2 rounded-[3px]"
                    :style="{ background: slotColor(infPlatformIndex(post.platform)) }"
                    aria-hidden="true"
                  />
                  {{ post.platformName }}
                </span>
                <span>{{ kindOf(post.kind).label }}</span>
                <span>{{ relativeLabel(post.day) }}</span>
              </p>
            </div>

            <ul class="flex shrink-0 items-center gap-3 text-xs text-[var(--text-muted)]">
              <li class="inline-flex items-center gap-1">
                <Icon name="lucide:heart" class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{{ formatCompact(post.likes) }}</span>
                <span class="sr-only">likes</span>
              </li>
              <li class="inline-flex items-center gap-1">
                <Icon name="lucide:message-circle" class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{{ formatCompact(post.comments) }}</span>
                <span class="sr-only">comments</span>
              </li>
              <li class="inline-flex items-center gap-1">
                <Icon name="lucide:share-2" class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{{ formatCompact(post.shares) }}</span>
                <span class="sr-only">shares</span>
              </li>
            </ul>

            <div class="w-24 shrink-0">
              <p class="text-end text-sm font-semibold tabular-nums text-[var(--text-strong)]">
                {{ rate(post.rate) }}
              </p>
              <div class="mt-1 h-1.5 overflow-hidden rounded-pill bg-[var(--surface-sunken)]">
                <div
                  class="h-full rounded-pill"
                  :style="{
                    width: `${Math.max(4, (post.rate / peakRate) * 100)}%`,
                    background: slotColor(infPlatformIndex(post.platform)),
                  }"
                />
              </div>
              <p class="mt-1 text-end text-[11px] tabular-nums text-[var(--text-muted)]">
                {{ formatCompact(post.reach) }} reached
              </p>
            </div>
          </li>
        </ul>

        <GorgEmptyState
          v-else
          icon="lucide:image-off"
          title="No post matches"
          :description="isFiltered ? 'Nothing in the window matches that search.' : 'No posts have been published yet.'"
        >
          <template #action>
            <GorgButton size="sm" variant="outline" @click="reset">
              Show every post
            </GorgButton>
          </template>
        </GorgEmptyState>
      </GorgCard>

      <!-- audience -->
      <div class="min-w-0 space-y-4">
        <GorgCard class="min-w-0">
          <GorgChartFrame
            title="Audience by age"
            subtitle="Share of followers, all platforms"
            :series="ageSeries"
            :labels="ageLabels"
            :height="240"
          >
            <GorgBarChart
              :series="ageSeries"
              :labels="ageLabels"
              :height="240"
              :format="n => `${n}%`"
            />
          </GorgChartFrame>
        </GorgCard>

        <GorgWidgetRankedList
          title="Top locations"
          :rows="infTopCountries"
          :format="n => `${n.toFixed(1)}%`"
        />
      </div>
    </div>

    <div ref="campaignPanel" class="js-reveal min-w-0">
      <GorgCard :padded="false" class="min-w-0">
        <div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--surface-border)] p-4">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-strong)]">Active campaigns</h2>
            <p class="mt-0.5 text-xs text-[var(--text-muted)]">
              {{ money(contracted) }} contracted · {{ outstanding }} deliverables outstanding
            </p>
          </div>
          <GorgButton variant="outline" size="xs">
            <template #lead>
              <Icon name="lucide:file-plus-2" class="size-3.5" />
            </template>
            New brief
          </GorgButton>
        </div>

        <ul class="divide-y divide-[var(--surface-border)]">
          <li
            v-for="c in infCampaigns"
            :key="c.id"
            class="flex flex-col gap-3 px-4 py-3.5 transition-colors duration-(--duration-snap)
                   hover:bg-[var(--surface-sunken)] sm:flex-row sm:items-center"
          >
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-[var(--text-strong)]">{{ c.brand }}</span>
                <GorgBadge :tone="campaignMeta[c.status].tone" size="xs">
                  <Icon :name="campaignMeta[c.status].icon" class="size-3" aria-hidden="true" />
                  {{ campaignMeta[c.status].label }}
                </GorgBadge>
              </p>
              <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
                <span class="inline-flex items-center gap-1">
                  <span
                    class="size-2 rounded-[3px]"
                    :style="{ background: slotColor(infPlatformIndex(c.platform)) }"
                    aria-hidden="true"
                  />
                  {{ infPlatforms[infPlatformIndex(c.platform)]!.name }}
                </span>
                <span>{{ c.scope }}</span>
                <span
                  :class="c.dueDay < 0 && c.delivered < c.deliverables
                    ? 'font-medium text-[var(--color-critical)]'
                    : ''"
                >
                  due {{ relativeLabel(c.dueDay) }}
                </span>
              </p>
            </div>

            <div class="w-full shrink-0 sm:w-48">
              <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span class="text-[var(--text-muted)]">Deliverables</span>
                <span class="font-medium tabular-nums text-[var(--text-strong)]">
                  {{ c.delivered }} / {{ c.deliverables }}
                </span>
              </div>
              <GorgProgress
                :value="(c.delivered / c.deliverables) * 100"
                size="xs"
                :tone="c.status === 'at-risk' ? 'critical' : c.delivered === c.deliverables ? 'positive' : 'brand'"
              />
            </div>

            <p class="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-strong)] sm:w-24 sm:text-end">
              {{ money(c.fee) }}
            </p>
          </li>
        </ul>
      </GorgCard>
    </div>
  </div>
</template>
