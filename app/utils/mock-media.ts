/**
 * Sample data for the media and travel dashboards — creator analytics, the
 * video library and airline departures.
 *
 * Three rules hold this file together:
 *
 * 1. Nothing reads the wall clock. Every timestamp derives from the fixed demo
 *    epoch through `~/utils/datetime`, so the server and the browser build the
 *    same strings and Vue never reports a hydration mismatch.
 * 2. Every pseudo-random series draws from its OWN seeded generator, declared
 *    beside it. A single shared stream makes a series depend on how many series
 *    were built before it, so any re-ordering — or a tree-shaken import — turns
 *    into silent data drift between renders.
 * 3. Fixtures are finished at module scope. A page slices them; it never
 *    generates during `setup`.
 */
import { demoDate, monthDayLabel, shortDayLabel } from '~/utils/datetime'

/* -------------------------------------------------------------------------
   Deterministic generators
   ---------------------------------------------------------------------- */

/** xorshift32 — integer ops only, so every runtime produces the same stream. */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 0x9E3779B9
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

/**
 * Noisy values around a mean, clamped to a band.
 * `slope` tilts the mean across the window (end minus start, halved each side
 * of centre) so a metric can trend without a second generator.
 */
function wave(seed: number, n: number, mean: number, spread: number, opts: {
  decimals?: number
  min?: number
  max?: number
  slope?: number
} = {}): number[] {
  const { decimals = 0, min = -Infinity, max = Infinity, slope = 0 } = opts
  const next = rng(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) - 0.5 : 0
    // Two draws average toward the mean, which reads more like a measurement
    // than a flat uniform band.
    const noise = (next() + next() - 1) * spread
    out.push(round(Math.min(max, Math.max(min, mean + slope * t + noise)), decimals))
  }
  return out
}

/**
 * Apply a weekend multiplier to a daily series.
 * Audience metrics have a weekly rhythm; a series without one reads as fake.
 * The weekday comes from the demo epoch, never from the clock.
 */
function weekendShaped(values: number[], factor: number): number[] {
  const n = values.length
  return values.map((v, i) => {
    const dow = demoDate(-(n - 1 - i)).getUTCDay()
    return Math.round(v * (dow === 0 || dow === 6 ? factor : 1))
  })
}

/** Running total of `steps`, landing exactly on `end`. */
function cumulativeTo(steps: number[], end: number): number[] {
  const total = steps.reduce((a, b) => a + b, 0)
  let v = end - total
  return steps.map((step) => {
    v += step
    return Math.round(v)
  })
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

/* =========================================================================
   Influencer — creator and social analytics
   ====================================================================== */

/** Days of follower history on file. The page reslices this, never regenerates. */
export const INF_DAYS = 120

/** `Sep 15` ticks, oldest first. */
export const infDayLabels: string[] = Array.from(
  { length: INF_DAYS },
  (_, i) => monthDayLabel(-(INF_DAYS - 1 - i)),
)

export interface InfPlatform {
  id: string
  name: string
  handle: string
  icon: string
  /** Followers as of the demo epoch. */
  followers: number
  /** Net adds over the last 30 days, as a fraction of the base. */
  followersDelta: number
  /** Interactions per impression, as a fraction. */
  engagement: number
  /** Accounts reached in the last 30 days. */
  reach: number
  posts: number
  /** Median seconds watched per view — the one number that differs per network. */
  dwellSeconds: number
  /** Daily net adds, `INF_DAYS` long. */
  netNew: number[]
  /** Cumulative followers, `INF_DAYS` long, ending on `followers`. */
  history: number[]
}

/**
 * Order is the colour order. A platform keeps its `slotColor(index)` on the
 * growth chart, in its performance card, on every post thumbnail and in the
 * campaign list — so the legend only has to be read once.
 */
function platform(
  id: string,
  name: string,
  handle: string,
  icon: string,
  seed: number,
  followers: number,
  meanAdd: number,
  spread: number,
  slope: number,
  weekend: number,
  rest: { followersDelta: number, engagement: number, reach: number, posts: number, dwellSeconds: number },
): InfPlatform {
  const netNew = weekendShaped(wave(seed, INF_DAYS, meanAdd, spread, { min: 0, slope }), weekend)
  return { id, name, handle, icon, followers, netNew, history: cumulativeTo(netNew, followers), ...rest }
}

export const infPlatforms: InfPlatform[] = [
  platform('instagram', 'Instagram', '@arbor.studio', 'lucide:instagram', 20260114, 412_580, 640, 280, 210, 1.16, {
    followersDelta: 0.048, engagement: 0.058, reach: 2_410_000, posts: 41, dwellSeconds: 9,
  }),
  platform('youtube', 'YouTube', 'Arbor Studio', 'lucide:youtube', 20260215, 268_940, 405, 195, 140, 1.22, {
    followersDelta: 0.052, engagement: 0.032, reach: 1_880_000, posts: 12, dwellSeconds: 214,
  }),
  platform('tiktok', 'TikTok', '@arborstudio', 'lucide:music', 20260316, 196_410, 980, 520, 620, 1.09, {
    followersDelta: 0.174, engagement: 0.074, reach: 3_120_000, posts: 58, dwellSeconds: 17,
  }),
  platform('twitch', 'Twitch', 'arborlive', 'lucide:twitch', 20260417, 88_260, 142, 96, 40, 1.34, {
    followersDelta: 0.061, engagement: 0.116, reach: 604_000, posts: 22, dwellSeconds: 1_640,
  }),
]

/** Index lookup, so a post or a campaign resolves to the same colour slot. */
export function infPlatformIndex(id: string): number {
  const i = infPlatforms.findIndex(p => p.id === id)
  return i < 0 ? 0 : i
}

/** Combined daily reach, for the reach tile's sparkline. */
export const infReachDaily: number[] = weekendShaped(
  wave(20260518, INF_DAYS, 248_000, 46_000, { min: 40_000, slope: 96_000 }),
  1.14,
)

/** Twelve weeks of paid work, oldest first — the earnings tile's sparkline. */
export const infEarningsWeekly: number[] = wave(20260619, 12, 14_800, 4_200, { min: 2_000, slope: 7_400 })

export const infPulse = {
  followers: infPlatforms.reduce((a, p) => a + p.followers, 0),
  followersDelta: 0.071,
  /** Percent, not a fraction — the tile animates it with `decimals: 1`. */
  engagement: 6.4,
  engagementDelta: 0.093,
  reach: infPlatforms.reduce((a, p) => a + p.reach, 0),
  reachDelta: 0.128,
  /** Dollars, booked this month. */
  earnings: 68_420,
  earningsDelta: 0.216,
  /** Brand deals currently under contract. */
  campaigns: 5,
}

export type InfPostKind = 'reel' | 'short' | 'video' | 'photo' | 'carousel' | 'live'

export const infPostKindMeta: Record<InfPostKind, { label: string, icon: string }> = {
  reel: { label: 'Reel', icon: 'lucide:clapperboard' },
  short: { label: 'Short', icon: 'lucide:zap' },
  video: { label: 'Video', icon: 'lucide:play' },
  photo: { label: 'Photo', icon: 'lucide:image' },
  carousel: { label: 'Carousel', icon: 'lucide:layers' },
  live: { label: 'Live', icon: 'lucide:radio' },
}

export interface InfPost {
  id: string
  title: string
  platform: string
  kind: InfPostKind
  /** Day offset from the demo epoch; always negative. */
  day: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  /** Single glyph for the thumbnail block — no external image is loaded. */
  glyph: string
}

export const infPosts: InfPost[] = [
  { id: 'p-01', title: 'Rebuilding a 1970s desk lamp', platform: 'tiktok', kind: 'reel', day: -3, reach: 486_200, likes: 51_400, comments: 2_180, shares: 9_640, saves: 14_900, glyph: 'R' },
  { id: 'p-02', title: 'Every joint in one cabinet', platform: 'youtube', kind: 'video', day: -6, reach: 312_800, likes: 18_600, comments: 1_420, shares: 2_310, saves: 7_880, glyph: 'E' },
  { id: 'p-03', title: 'The shop tour nobody asked for', platform: 'instagram', kind: 'carousel', day: -2, reach: 268_400, likes: 32_900, comments: 1_860, shares: 3_420, saves: 11_200, glyph: 'T' },
  { id: 'p-04', title: 'Milling a slab flat with hand tools', platform: 'tiktok', kind: 'reel', day: -9, reach: 241_600, likes: 27_300, comments: 940, shares: 5_180, saves: 8_460, glyph: 'M' },
  { id: 'p-05', title: 'Answering your finish questions live', platform: 'twitch', kind: 'live', day: -4, reach: 96_400, likes: 14_800, comments: 6_120, shares: 820, saves: 1_240, glyph: 'A' },
  { id: 'p-06', title: 'Three chisels, ten years apart', platform: 'instagram', kind: 'photo', day: -11, reach: 184_900, likes: 21_400, comments: 780, shares: 1_640, saves: 6_320, glyph: 'C' },
  { id: 'p-07', title: 'What a $40 plane can actually do', platform: 'youtube', kind: 'video', day: -14, reach: 226_100, likes: 15_900, comments: 2_040, shares: 1_980, saves: 9_140, glyph: 'W' },
  { id: 'p-08', title: 'Dovetails at 6am, no talking', platform: 'tiktok', kind: 'short', day: -7, reach: 162_300, likes: 19_700, comments: 610, shares: 3_940, saves: 5_210, glyph: 'D' },
  { id: 'p-09', title: 'Sharpening, the boring version', platform: 'instagram', kind: 'reel', day: -17, reach: 148_700, likes: 16_200, comments: 520, shares: 2_180, saves: 7_640, glyph: 'S' },
  { id: 'p-10', title: 'Build night — the bench vice', platform: 'twitch', kind: 'live', day: -12, reach: 74_200, likes: 10_400, comments: 4_860, shares: 540, saves: 910, glyph: 'B' },
  { id: 'p-11', title: 'Reading grain direction in 60 seconds', platform: 'tiktok', kind: 'short', day: -20, reach: 131_500, likes: 14_600, comments: 430, shares: 2_980, saves: 4_120, glyph: 'G' },
  { id: 'p-12', title: 'Ten years of offcuts, one shelf', platform: 'youtube', kind: 'video', day: -23, reach: 158_400, likes: 11_200, comments: 1_180, shares: 1_320, saves: 6_040, glyph: 'O' },
]

/** Interactions per account reached. The list ranks on this, not on raw likes. */
export function infEngagementRate(post: InfPost): number {
  return (post.likes + post.comments + post.shares + post.saves) / post.reach
}

export interface InfAudienceBand {
  label: string
  /** Share of the audience, as a percentage. */
  share: number
}

export const infAgeBands: InfAudienceBand[] = [
  { label: '13–17', share: 7.8 },
  { label: '18–24', share: 31.4 },
  { label: '25–34', share: 34.6 },
  { label: '35–44', share: 16.2 },
  { label: '45–54', share: 6.9 },
  { label: '55+', share: 3.1 },
]

export const infTopCountries = [
  { label: 'United States', value: 31.4, icon: 'lucide:map-pin' },
  { label: 'United Kingdom', value: 12.8, icon: 'lucide:map-pin' },
  { label: 'Germany', value: 9.6, icon: 'lucide:map-pin' },
  { label: 'Brazil', value: 8.1, icon: 'lucide:map-pin' },
  { label: 'Canada', value: 6.4, icon: 'lucide:map-pin' },
  { label: 'Australia', value: 5.2, icon: 'lucide:map-pin' },
]

export type InfCampaignStatus = 'live' | 'in-review' | 'scheduled' | 'at-risk'

export interface InfCampaign {
  id: string
  brand: string
  scope: string
  platform: string
  /** Contract value in dollars. */
  fee: number
  /** Day offsets from the demo epoch. */
  startDay: number
  dueDay: number
  delivered: number
  deliverables: number
  status: InfCampaignStatus
}

export const infCampaigns: InfCampaign[] = [
  { id: 'c-01', brand: 'Kestrel Tools', scope: '3 reels · 1 long-form', platform: 'youtube', fee: 24_000, startDay: -26, dueDay: 4, delivered: 3, deliverables: 4, status: 'live' },
  { id: 'c-02', brand: 'Northwood Timber', scope: '6 shorts · usage rights', platform: 'tiktok', fee: 16_500, startDay: -18, dueDay: -1, delivered: 4, deliverables: 6, status: 'at-risk' },
  { id: 'c-03', brand: 'Alder & Co.', scope: '2 carousels · 1 story set', platform: 'instagram', fee: 9_800, startDay: -12, dueDay: 9, delivered: 2, deliverables: 3, status: 'live' },
  { id: 'c-04', brand: 'Gravel Coffee', scope: '1 stream takeover', platform: 'twitch', fee: 7_200, startDay: -5, dueDay: 12, delivered: 0, deliverables: 1, status: 'scheduled' },
  { id: 'c-05', brand: 'Beacon Finishes', scope: '4 reels · paid boost', platform: 'instagram', fee: 11_400, startDay: -40, dueDay: -3, delivered: 4, deliverables: 4, status: 'in-review' },
]

/* =========================================================================
   Video — media library, watch time and encoding
   ====================================================================== */

export const VID_DAYS = 90

export const vidDayLabels: string[] = Array.from(
  { length: VID_DAYS },
  (_, i) => monthDayLabel(-(VID_DAYS - 1 - i)),
)

/**
 * Views and watch hours are different scales and different units, so they are
 * never drawn against two y-axes. The page gives each its own plot.
 */
export const vidViewsDaily: number[] = weekendShaped(
  wave(20260721, VID_DAYS, 286_000, 41_000, { min: 60_000, slope: 74_000 }),
  1.21,
)

export const vidWatchHoursDaily: number[] = weekendShaped(
  wave(20260822, VID_DAYS, 15_900, 2_400, { min: 4_000, slope: 4_600 }),
  1.18,
)

export const vidPulse = {
  watchHours: sum(vidWatchHoursDaily),
  watchDelta: 0.142,
  views: sum(vidViewsDaily),
  viewsDelta: 0.096,
  /** Median seconds watched per view. */
  avgViewSeconds: 201,
  avgViewDelta: 0.038,
  /** Percent of a video watched on an average view — `decimals: 1` on the tile. */
  completion: 42.6,
  completionDelta: -0.021,
  assets: 248,
  encodingJobs: 5,
}

export type VidStatus = 'live' | 'processing' | 'unlisted' | 'failed'

export const vidStatusMeta: Record<VidStatus, {
  label: string
  icon: string
  tone: 'positive' | 'info' | 'neutral' | 'critical'
}> = {
  live: { label: 'Live', icon: 'lucide:circle-check', tone: 'positive' },
  processing: { label: 'Processing', icon: 'lucide:loader-circle', tone: 'info' },
  unlisted: { label: 'Unlisted', icon: 'lucide:eye-off', tone: 'neutral' },
  failed: { label: 'Failed', icon: 'lucide:circle-x', tone: 'critical' },
}

export interface VidAsset {
  id: string
  title: string
  /** Playlist the asset belongs to; also fixes its thumbnail colour slot. */
  collection: string
  durationSec: number
  /** Publish day offset from the demo epoch. */
  day: number
  views: number
  watchHours: number
  /** Average share of the runtime watched, as a fraction. */
  completion: number
  status: VidStatus
  sizeGb: number
  /** Single glyph for the thumbnail block — no external image is loaded. */
  glyph: string
  /** Extra line under the title for anything not `live`. */
  note?: string
}

/** Fixed order — a collection keeps its `slotColor` across the whole page. */
export const vidCollections = ['Workshop', 'Field notes', 'Live archive', 'Shorts', 'Course'] as const

export function vidCollectionIndex(name: string): number {
  const i = vidCollections.indexOf(name as (typeof vidCollections)[number])
  return i < 0 ? 0 : i
}

export const vidAssets: VidAsset[] = [
  { id: 'v-201', title: 'Flattening a slab with hand planes', collection: 'Workshop', durationSec: 1_442, day: -2, views: 486_200, watchHours: 62_400, completion: 0.58, status: 'live', sizeGb: 9.4, glyph: 'F' },
  { id: 'v-202', title: 'Every joint in one cabinet', collection: 'Workshop', durationSec: 2_118, day: -6, views: 312_800, watchHours: 71_900, completion: 0.46, status: 'live', sizeGb: 13.8, glyph: 'E' },
  { id: 'v-203', title: 'Shop tour, ten years in', collection: 'Field notes', durationSec: 964, day: -4, views: 268_400, watchHours: 28_100, completion: 0.52, status: 'live', sizeGb: 6.1, glyph: 'S' },
  { id: 'v-204', title: 'Build night — the bench vice', collection: 'Live archive', durationSec: 7_284, day: -5, views: 74_200, watchHours: 44_600, completion: 0.24, status: 'live', sizeGb: 41.2, glyph: 'B' },
  { id: 'v-205', title: 'Dovetails at 6am, no talking', collection: 'Shorts', durationSec: 58, day: -7, views: 162_300, watchHours: 1_940, completion: 0.81, status: 'live', sizeGb: 0.4, glyph: 'D' },
  { id: 'v-206', title: 'Sharpening: the boring version', collection: 'Workshop', durationSec: 1_106, day: -11, views: 148_700, watchHours: 22_800, completion: 0.49, status: 'live', sizeGb: 7.2, glyph: 'H' },
  { id: 'v-207', title: 'What a $40 plane can actually do', collection: 'Field notes', durationSec: 1_688, day: -14, views: 226_100, watchHours: 38_400, completion: 0.44, status: 'live', sizeGb: 10.6, glyph: 'W' },
  { id: 'v-208', title: 'Module 1 — reading grain', collection: 'Course', durationSec: 1_320, day: -16, views: 41_800, watchHours: 11_200, completion: 0.72, status: 'unlisted', sizeGb: 8.1, glyph: 'M', note: 'Course members only' },
  { id: 'v-209', title: 'Module 2 — layout and marking', collection: 'Course', durationSec: 1_512, day: -15, views: 38_400, watchHours: 10_600, completion: 0.69, status: 'unlisted', sizeGb: 9.0, glyph: 'M', note: 'Course members only' },
  { id: 'v-210', title: 'Ten years of offcuts, one shelf', collection: 'Workshop', durationSec: 1_834, day: -23, views: 158_400, watchHours: 31_200, completion: 0.41, status: 'live', sizeGb: 11.4, glyph: 'O' },
  { id: 'v-211', title: 'Finish test — 14 samples, 90 days', collection: 'Field notes', durationSec: 2_460, day: -1, views: 12_600, watchHours: 2_100, completion: 0.38, status: 'processing', sizeGb: 16.2, glyph: 'T', note: 'Transcoding 1080p · 62%' },
  { id: 'v-212', title: 'Q&A — finishes and failures', collection: 'Live archive', durationSec: 6_120, day: -12, views: 58_900, watchHours: 29_400, completion: 0.27, status: 'live', sizeGb: 34.8, glyph: 'Q' },
  { id: 'v-213', title: 'Resawing on a small bandsaw', collection: 'Workshop', durationSec: 1_248, day: -28, views: 132_500, watchHours: 20_100, completion: 0.47, status: 'live', sizeGb: 7.8, glyph: 'R' },
  { id: 'v-214', title: 'One tool, thirty cuts', collection: 'Shorts', durationSec: 46, day: -9, views: 131_500, watchHours: 1_420, completion: 0.86, status: 'live', sizeGb: 0.3, glyph: 'N' },
  { id: 'v-215', title: 'Module 3 — the first cut', collection: 'Course', durationSec: 1_704, day: -13, views: 34_900, watchHours: 9_800, completion: 0.66, status: 'unlisted', sizeGb: 10.2, glyph: 'M', note: 'Course members only' },
  { id: 'v-216', title: 'Hand-cut mortises, full take', collection: 'Workshop', durationSec: 3_006, day: -34, views: 96_400, watchHours: 26_300, completion: 0.35, status: 'live', sizeGb: 18.4, glyph: 'P' },
  { id: 'v-217', title: 'Wood movement, explained badly', collection: 'Shorts', durationSec: 52, day: -18, views: 118_200, watchHours: 1_260, completion: 0.79, status: 'live', sizeGb: 0.3, glyph: 'V' },
  { id: 'v-218', title: 'Studio rebuild — part four', collection: 'Field notes', durationSec: 2_244, day: 0, views: 0, watchHours: 0, completion: 0, status: 'failed', sizeGb: 22.6, glyph: 'U', note: 'Audio track missing — re-upload the master' },
  { id: 'v-219', title: 'Build night — drawer boxes', collection: 'Live archive', durationSec: 6_840, day: -26, views: 51_200, watchHours: 24_100, completion: 0.22, status: 'live', sizeGb: 38.1, glyph: 'K' },
  { id: 'v-220', title: 'Module 4 — assembly order', collection: 'Course', durationSec: 1_926, day: -10, views: 31_600, watchHours: 9_100, completion: 0.64, status: 'processing', sizeGb: 11.8, glyph: 'M', note: 'Generating captions · 41%' },
  { id: 'v-221', title: 'Three chisels, ten years apart', collection: 'Field notes', durationSec: 842, day: -31, views: 184_900, watchHours: 19_600, completion: 0.55, status: 'live', sizeGb: 5.2, glyph: 'C' },
  { id: 'v-222', title: 'Glue-up without the panic', collection: 'Workshop', durationSec: 1_386, day: -40, views: 142_800, watchHours: 23_400, completion: 0.48, status: 'live', sizeGb: 8.6, glyph: 'G' },
]

/** Retention samples at 0%, 5% … 100% of runtime. Percent of viewers still watching. */
export const VID_RETENTION_POINTS = 21

/**
 * Only the four videos the page offers for comparison carry a curve — the rest
 * are still aggregating, which is also why the selector is a fixed set rather
 * than every row in the table.
 */
export const vidRetention: Record<string, number[]> = {
  'v-201': [100, 91, 84, 79, 75, 72, 69, 66, 63, 61, 58, 55, 53, 50, 48, 45, 43, 40, 37, 33, 29],
  'v-202': [100, 86, 76, 70, 66, 62, 59, 56, 53, 50, 47, 45, 42, 40, 37, 35, 32, 30, 27, 24, 21],
  'v-204': [100, 74, 61, 53, 48, 44, 41, 38, 36, 34, 32, 30, 28, 27, 25, 24, 22, 21, 19, 18, 16],
  'v-205': [100, 98, 96, 95, 93, 92, 90, 89, 88, 86, 85, 84, 82, 81, 80, 79, 78, 77, 78, 80, 76],
}

/** Shown in the retention selector, in this order. */
export const vidRetentionPicks = ['v-201', 'v-202', 'v-204', 'v-205']

export type VidJobStage = 'ingest' | 'transcode' | 'captions' | 'packaging' | 'failed'

export const vidJobStageMeta: Record<VidJobStage, {
  label: string
  icon: string
  tone: 'brand' | 'info' | 'accent' | 'positive' | 'critical'
}> = {
  ingest: { label: 'Ingest', icon: 'lucide:upload', tone: 'brand' },
  transcode: { label: 'Transcode', icon: 'lucide:film', tone: 'info' },
  captions: { label: 'Captions', icon: 'lucide:captions', tone: 'accent' },
  packaging: { label: 'Packaging', icon: 'lucide:package', tone: 'positive' },
  failed: { label: 'Failed', icon: 'lucide:circle-x', tone: 'critical' },
}

export interface VidJob {
  id: string
  title: string
  stage: VidJobStage
  /** 0..1 through the current stage. */
  progress: number
  /** Minutes left; `0` once the job has stopped moving. */
  etaMin: number
  preset: string
  worker: string
}

export const vidEncodingQueue: VidJob[] = [
  { id: 'j-01', title: 'Finish test — 14 samples, 90 days', stage: 'transcode', progress: 0.62, etaMin: 18, preset: '1080p · h.264', worker: 'enc-04' },
  { id: 'j-02', title: 'Module 4 — assembly order', stage: 'captions', progress: 0.41, etaMin: 11, preset: 'en-GB · auto', worker: 'enc-02' },
  { id: 'j-03', title: 'Studio rebuild — part four', stage: 'failed', progress: 0.08, etaMin: 0, preset: '2160p · av1', worker: 'enc-01' },
  { id: 'j-04', title: 'Build night — drawer boxes (clip)', stage: 'packaging', progress: 0.88, etaMin: 3, preset: 'HLS · 6 renditions', worker: 'enc-03' },
  { id: 'j-05', title: 'Shorts batch — week 37', stage: 'ingest', progress: 0.24, etaMin: 26, preset: 'Source verify', worker: 'enc-04' },
]

/** Storage in gigabytes, in the order the meter stacks them. */
export const vidStorageTiers = [
  { label: 'Source masters', gb: 8_940 },
  { label: 'Renditions', gb: 5_210 },
  { label: 'Live archive', gb: 3_480 },
  { label: 'Thumbnails & sprites', gb: 610 },
  { label: 'Captions & metadata', gb: 92 },
]

export const vidStorageQuotaGb = 24_000

/* =========================================================================
   Flights — airline departures and operations
   ====================================================================== */

export const FLT_DAYS = 14

export const fltDayLabels: string[] = Array.from(
  { length: FLT_DAYS },
  (_, i) => shortDayLabel(-(FLT_DAYS - 1 - i)),
)

/** Both series are percentages, so one axis is honest. */
export const fltOnTimeDaily: number[] = wave(20260923, FLT_DAYS, 83.4, 4.2, { decimals: 1, min: 62, max: 97, slope: 5.4 })
export const fltLoadFactorDaily: number[] = wave(20261024, FLT_DAYS, 86.1, 3.1, { decimals: 1, min: 70, max: 98, slope: 3.2 })

/** Departures and arrivals are both movement counts — same axis, two series. */
export const fltHourLabels: string[] = Array.from(
  { length: 18 },
  (_, i) => `${String(i + 5).padStart(2, '0')}:00`,
)

export const fltDepsByHour: number[] = [9, 14, 12, 8, 6, 11, 13, 9, 5, 7, 12, 14, 10, 6, 8, 11, 7, 3]
export const fltArrsByHour: number[] = [3, 6, 10, 13, 12, 8, 6, 9, 12, 14, 11, 7, 6, 10, 13, 12, 9, 5]

export const fltPulse = {
  /** Percent departing within 15 minutes of schedule — `decimals: 1` on the tile. */
  onTime: 86.2,
  onTimeDelta: 0.041,
  flights: 164,
  flightsDelta: 0.027,
  /** Percent of seats sold — `decimals: 1` on the tile. */
  loadFactor: 88.4,
  loadFactorDelta: 0.018,
  disruptions: 3,
  disruptionsDelta: 0.5,
  /** Passengers booked on today's programme. */
  passengers: 24_860,
  destinations: 41,
}

export interface FltCause {
  id: string
  name: string
  icon: string
  /** Delay minutes attributed today. */
  minutes: number
  flights: number
}

/** Fixed order — a cause keeps its `slotColor` in the chart, the legend and the list. */
export const fltCauses: FltCause[] = [
  { id: 'inbound', name: 'Late inbound aircraft', icon: 'lucide:plane', minutes: 412, flights: 9 },
  { id: 'atc', name: 'ATC flow', icon: 'lucide:radio', minutes: 268, flights: 5 },
  { id: 'weather', name: 'Weather', icon: 'lucide:cloud-rain', minutes: 194, flights: 4 },
  { id: 'ground', name: 'Ground handling', icon: 'lucide:luggage', minutes: 126, flights: 6 },
  { id: 'technical', name: 'Technical', icon: 'lucide:wrench', minutes: 88, flights: 2 },
  { id: 'crew', name: 'Crew', icon: 'lucide:users', minutes: 54, flights: 2 },
]

export const fltCauseDayLabels: string[] = Array.from(
  { length: 7 },
  (_, i) => shortDayLabel(-(6 - i)),
)

/** Delay minutes per cause over the last seven days, same order as `fltCauses`. */
export const fltCauseDaily: number[][] = [
  [286, 341, 302, 268, 394, 358, 412],
  [198, 142, 224, 306, 186, 241, 268],
  [96, 88, 412, 264, 118, 142, 194],
  [148, 132, 106, 121, 164, 138, 126],
  [42, 116, 64, 38, 92, 46, 88],
  [68, 44, 52, 86, 38, 61, 54],
]

export type FltStatus = 'on-time' | 'boarding' | 'delayed' | 'departed' | 'cancelled'

/**
 * Every status carries a word AND a glyph. The board is the one surface where
 * colour alone would be read as the whole signal, and it must not be.
 */
export const fltStatusMeta: Record<FltStatus, {
  label: string
  icon: string
  tone: 'neutral' | 'info' | 'brand' | 'positive' | 'caution' | 'critical'
  /** Sort rank: what an ops desk wants at the top. */
  rank: number
}> = {
  'cancelled': { label: 'Cancelled', icon: 'lucide:circle-x', tone: 'critical', rank: 0 },
  'delayed': { label: 'Delayed', icon: 'lucide:triangle-alert', tone: 'caution', rank: 1 },
  'boarding': { label: 'Boarding', icon: 'lucide:door-open', tone: 'brand', rank: 2 },
  'on-time': { label: 'On time', icon: 'lucide:circle-check', tone: 'positive', rank: 3 },
  'departed': { label: 'Departed', icon: 'lucide:plane-takeoff', tone: 'neutral', rank: 4 },
}

export interface FltFlight {
  id: string
  flightNo: string
  destination: string
  destCode: string
  gate: string
  /** Scheduled off-block. */
  sched: Date
  /** Estimated off-block; equals `sched` when there is no revision. */
  est: Date
  delayMin: number
  status: FltStatus
  aircraft: string
  type: string
  pax: number
  seats: number
  /** Why it moved; empty for an on-schedule departure. */
  remark: string
  /** Cause id, so a delayed flight links back to the breakdown's colour. */
  cause?: string
}

/** Hour and minute on the demo day — never a wall-clock read. */
const at = (h: number, m: number) => demoDate(0, h, m)

export const fltBoard: FltFlight[] = [
  { id: 'f-218', flightNo: 'NL 218', destination: 'Amsterdam', destCode: 'AMS', gate: 'B12', sched: at(5, 35), est: at(5, 35), delayMin: 0, status: 'departed', aircraft: 'G-NLBA', type: 'A320neo', pax: 164, seats: 180, remark: 'Off-block 05:33' },
  { id: 'f-402', flightNo: 'NL 402', destination: 'Dublin', destCode: 'DUB', gate: 'A04', sched: at(5, 50), est: at(6, 5), delayMin: 15, status: 'departed', aircraft: 'G-NLBD', type: 'A321neo', pax: 196, seats: 214, remark: 'Held for inbound bags', cause: 'ground' },
  { id: 'f-116', flightNo: 'NL 116', destination: 'Paris', destCode: 'CDG', gate: 'B07', sched: at(6, 10), est: at(6, 10), delayMin: 0, status: 'departed', aircraft: 'G-NLBE', type: 'A220-300', pax: 131, seats: 148, remark: 'Off-block 06:08' },
  { id: 'f-640', flightNo: 'NL 640', destination: 'Copenhagen', destCode: 'CPH', gate: 'A11', sched: at(6, 25), est: at(6, 25), delayMin: 0, status: 'boarding', aircraft: 'G-NLBG', type: 'A321neo', pax: 188, seats: 214, remark: 'Gate closes 06:15' },
  { id: 'f-305', flightNo: 'NL 305', destination: 'Munich', destCode: 'MUC', gate: 'B03', sched: at(6, 40), est: at(7, 25), delayMin: 45, status: 'delayed', aircraft: 'G-NLBC', type: 'A320neo', pax: 172, seats: 180, remark: 'Inbound aircraft landed 06:12', cause: 'inbound' },
  { id: 'f-128', flightNo: 'NL 128', destination: 'Barcelona', destCode: 'BCN', gate: 'C02', sched: at(6, 55), est: at(6, 55), delayMin: 0, status: 'boarding', aircraft: 'G-NLBH', type: 'A320neo', pax: 177, seats: 180, remark: 'Gate closes 06:45' },
  { id: 'f-512', flightNo: 'NL 512', destination: 'Oslo', destCode: 'OSL', gate: 'A07', sched: at(7, 5), est: at(7, 5), delayMin: 0, status: 'on-time', aircraft: 'G-NLBJ', type: 'A220-300', pax: 128, seats: 148, remark: '' },
  { id: 'f-224', flightNo: 'NL 224', destination: 'Amsterdam', destCode: 'AMS', gate: 'B12', sched: at(7, 20), est: at(7, 20), delayMin: 0, status: 'on-time', aircraft: 'G-NLBK', type: 'A320neo', pax: 169, seats: 180, remark: '' },
  { id: 'f-730', flightNo: 'NL 730', destination: 'Lisbon', destCode: 'LIS', gate: 'C06', sched: at(7, 35), est: at(8, 50), delayMin: 75, status: 'delayed', aircraft: 'G-NLBL', type: 'A321neo', pax: 203, seats: 214, remark: 'ATC slot 08:52 — Iberian sector', cause: 'atc' },
  { id: 'f-144', flightNo: 'NL 144', destination: 'Milan', destCode: 'MXP', gate: 'B09', sched: at(7, 50), est: at(7, 50), delayMin: 0, status: 'on-time', aircraft: 'G-NLBM', type: 'A220-300', pax: 141, seats: 148, remark: '' },
  { id: 'f-808', flightNo: 'NL 808', destination: 'Reykjavik', destCode: 'KEF', gate: 'A02', sched: at(8, 5), est: at(8, 5), delayMin: 0, status: 'cancelled', aircraft: 'G-NLBF', type: 'A320neo', pax: 172, seats: 180, remark: 'Hydraulic fault — no spare airframe', cause: 'technical' },
  { id: 'f-336', flightNo: 'NL 336', destination: 'Zurich', destCode: 'ZRH', gate: 'B05', sched: at(8, 20), est: at(8, 20), delayMin: 0, status: 'on-time', aircraft: 'G-NLBN', type: 'A320neo', pax: 158, seats: 180, remark: '' },
  { id: 'f-460', flightNo: 'NL 460', destination: 'Berlin', destCode: 'BER', gate: 'C04', sched: at(8, 35), est: at(8, 55), delayMin: 20, status: 'delayed', aircraft: 'G-NLBP', type: 'A220-300', pax: 139, seats: 148, remark: 'One loader short on stand 14', cause: 'ground' },
  { id: 'f-152', flightNo: 'NL 152', destination: 'Madrid', destCode: 'MAD', gate: 'B11', sched: at(8, 50), est: at(8, 50), delayMin: 0, status: 'on-time', aircraft: 'G-NLBQ', type: 'A321neo', pax: 199, seats: 214, remark: '' },
  { id: 'f-918', flightNo: 'NL 918', destination: 'Stockholm', destCode: 'ARN', gate: 'A09', sched: at(9, 5), est: at(9, 5), delayMin: 0, status: 'on-time', aircraft: 'G-NLBR', type: 'A320neo', pax: 166, seats: 180, remark: '' },
  { id: 'f-244', flightNo: 'NL 244', destination: 'Paris', destCode: 'CDG', gate: 'B07', sched: at(9, 20), est: at(9, 40), delayMin: 20, status: 'delayed', aircraft: 'G-NLBC', type: 'A320neo', pax: 174, seats: 180, remark: 'Knock-on from NL 305 turnaround', cause: 'inbound' },
  { id: 'f-626', flightNo: 'NL 626', destination: 'Vienna', destCode: 'VIE', gate: 'C08', sched: at(9, 35), est: at(9, 35), delayMin: 0, status: 'on-time', aircraft: 'G-NLBS', type: 'A220-300', pax: 134, seats: 148, remark: '' },
  { id: 'f-170', flightNo: 'NL 170', destination: 'Rome', destCode: 'FCO', gate: 'B02', sched: at(9, 50), est: at(10, 35), delayMin: 45, status: 'delayed', aircraft: 'G-NLBT', type: 'A321neo', pax: 208, seats: 214, remark: 'Thunderstorms at destination', cause: 'weather' },
  { id: 'f-550', flightNo: 'NL 550', destination: 'Helsinki', destCode: 'HEL', gate: 'A05', sched: at(10, 5), est: at(10, 5), delayMin: 0, status: 'on-time', aircraft: 'G-NLBU', type: 'A320neo', pax: 152, seats: 180, remark: '' },
  { id: 'f-282', flightNo: 'NL 282', destination: 'Brussels', destCode: 'BRU', gate: 'B14', sched: at(10, 20), est: at(10, 20), delayMin: 0, status: 'on-time', aircraft: 'G-NLBV', type: 'A220-300', pax: 122, seats: 148, remark: '' },
  { id: 'f-744', flightNo: 'NL 744', destination: 'Porto', destCode: 'OPO', gate: 'C10', sched: at(10, 35), est: at(10, 50), delayMin: 15, status: 'delayed', aircraft: 'G-NLBW', type: 'A320neo', pax: 178, seats: 180, remark: 'Crew inbound on NL 402', cause: 'crew' },
  { id: 'f-190', flightNo: 'NL 190', destination: 'Geneva', destCode: 'GVA', gate: 'B06', sched: at(10, 50), est: at(10, 50), delayMin: 0, status: 'on-time', aircraft: 'G-NLBX', type: 'A220-300', pax: 137, seats: 148, remark: '' },
  { id: 'f-866', flightNo: 'NL 866', destination: 'Edinburgh', destCode: 'EDI', gate: 'A12', sched: at(11, 5), est: at(11, 5), delayMin: 0, status: 'on-time', aircraft: 'G-NLBY', type: 'A320neo', pax: 161, seats: 180, remark: '' },
  { id: 'f-358', flightNo: 'NL 358', destination: 'Prague', destCode: 'PRG', gate: 'C03', sched: at(11, 20), est: at(11, 20), delayMin: 0, status: 'on-time', aircraft: 'G-NLBZ', type: 'A321neo', pax: 191, seats: 214, remark: '' },
]

export type FltAircraftState = 'in-service' | 'turnaround' | 'maintenance'

export const fltAircraftStateMeta: Record<FltAircraftState, {
  label: string
  icon: string
  tone: 'positive' | 'brand' | 'caution'
}> = {
  'in-service': { label: 'In service', icon: 'lucide:plane-takeoff', tone: 'positive' },
  'turnaround': { label: 'On turnaround', icon: 'lucide:refresh-cw', tone: 'brand' },
  'maintenance': { label: 'Maintenance', icon: 'lucide:wrench', tone: 'caution' },
}

export interface FltAircraft {
  reg: string
  type: string
  stand: string
  sectors: number
  /** Block hours flown today, against the daily plan. */
  blockHours: number
  targetHours: number
  /** Last turnaround, against the type's standard. */
  turnaroundMin: number
  targetTurnaroundMin: number
  state: FltAircraftState
}

export const fltFleet: FltAircraft[] = [
  { reg: 'G-NLBA', type: 'A320neo', stand: '21', sectors: 4, blockHours: 9.2, targetHours: 11, turnaroundMin: 34, targetTurnaroundMin: 40, state: 'in-service' },
  { reg: 'G-NLBC', type: 'A320neo', stand: '14', sectors: 3, blockHours: 7.8, targetHours: 11, turnaroundMin: 46, targetTurnaroundMin: 40, state: 'turnaround' },
  { reg: 'G-NLBD', type: 'A321neo', stand: '08', sectors: 4, blockHours: 10.4, targetHours: 11, turnaroundMin: 38, targetTurnaroundMin: 45, state: 'in-service' },
  { reg: 'G-NLBE', type: 'A220-300', stand: '32', sectors: 5, blockHours: 10.9, targetHours: 11, turnaroundMin: 29, targetTurnaroundMin: 35, state: 'in-service' },
  { reg: 'G-NLBF', type: 'A320neo', stand: 'M2', sectors: 1, blockHours: 2.4, targetHours: 11, turnaroundMin: 0, targetTurnaroundMin: 40, state: 'maintenance' },
  { reg: 'G-NLBG', type: 'A321neo', stand: '11', sectors: 3, blockHours: 8.1, targetHours: 11, turnaroundMin: 41, targetTurnaroundMin: 45, state: 'turnaround' },
]

export interface FltDisruption {
  id: string
  flightNo: string
  headline: string
  detail: string
  severity: 'critical' | 'caution'
  pax: number
  rebooked: number
  owner: string
  since: Date
  cause: string
}

export const fltDisruptions: FltDisruption[] = [
  {
    id: 'd-01',
    flightNo: 'NL 808',
    headline: 'KEF cancelled — no spare airframe',
    detail: 'G-NLBF is on stand M2 with a hydraulic fault. Nothing in the fleet releases before 14:00, so the rotation is broken for the rest of the day.',
    severity: 'critical',
    pax: 172,
    rebooked: 138,
    owner: 'Duty ops · R. Falk',
    since: at(4, 10),
    cause: 'technical',
  },
  {
    id: 'd-02',
    flightNo: 'NL 730',
    headline: 'Iberian sector flow — 75 minute slot',
    detail: 'Departure held to an 08:52 slot. 41 passengers miss their onward connection at LIS and need protecting before the gate opens.',
    severity: 'critical',
    pax: 203,
    rebooked: 22,
    owner: 'Network control · M. Oyelaran',
    since: at(6, 25),
    cause: 'atc',
  },
  {
    id: 'd-03',
    flightNo: 'NL 170',
    headline: 'Thunderstorms at FCO',
    detail: 'Destination is intermittently below minima until 11:00. Fuel uplift raised and the crew is at 9h40 of a 13h duty — the next revision puts the return sector at risk.',
    severity: 'caution',
    pax: 208,
    rebooked: 0,
    owner: 'Ops control · S. Ravn',
    since: at(7, 40),
    cause: 'weather',
  },
]
