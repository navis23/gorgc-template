/**
 * Deterministic sample data for the collection / browse layout pages.
 *
 * Everything here is a literal or derived from COLLECTION_BASE — no Math.random(),
 * no `new Date()` at module scope — so the server and the client render the
 * exact same markup and hydration stays quiet.
 */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DAY_MS = 86_400_000

/** Fixed "today" for every relative label on these pages. */
export const COLLECTION_BASE = Date.UTC(2026, 8, 15)

export function shiftDays(days: number): Date {
  return new Date(COLLECTION_BASE + days * DAY_MS)
}

/** "15 Sep 2026" — hand-formatted so no locale or timezone can drift. */
export function dayLabel(days: number): string {
  const d = shiftDays(days)
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "6 Oct" — the compact form for tight footers. */
export function shortDayLabel(days: number): string {
  const d = shiftDays(days)
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`
}

/** "in 4 days" / "yesterday" / "3 weeks ago" — never colour-alone, always words. */
export function relativeLabel(days: number): string {
  if (days === 0)
    return 'today'
  if (days === 1)
    return 'tomorrow'
  if (days === -1)
    return 'yesterday'

  const n = Math.abs(days)
  const unit = n >= 14 ? `${Math.round(n / 7)} weeks` : `${n} days`
  return days > 0 ? `in ${unit}` : `${unit} ago`
}

/* ------------------------------------------------------------------ *
 * 1 — people directory (card grid)
 * ------------------------------------------------------------------ */

export type Team = 'Platform' | 'Design' | 'Data' | 'Growth' | 'Support'
export type PresenceStatus = 'active' | 'focus' | 'away' | 'leave'

export interface DirectoryPerson {
  id: number
  name: string
  role: string
  team: Team
  status: PresenceStatus
  email: string
  location: string
  /** headline numbers shown on the card */
  shipped: number
  reviews: number
  tenure: string
}

export const TEAMS: Team[] = ['Platform', 'Design', 'Data', 'Growth', 'Support']

export const directory: DirectoryPerson[] = [
  { id: 1, name: 'Amara Osei', role: 'Staff engineer', team: 'Platform', status: 'active', email: 'amara.osei@gorg.dev', location: 'Accra', shipped: 84, reviews: 212, tenure: '4y 2m' },
  { id: 2, name: 'Tobias Lindqvist', role: 'Infrastructure lead', team: 'Platform', status: 'focus', email: 'tobias.l@gorg.dev', location: 'Malmö', shipped: 61, reviews: 340, tenure: '6y 0m' },
  { id: 3, name: 'Priya Raghunathan', role: 'Reliability engineer', team: 'Platform', status: 'active', email: 'priya.r@gorg.dev', location: 'Bengaluru', shipped: 47, reviews: 129, tenure: '2y 7m' },
  { id: 4, name: 'Ingrid Sørensen', role: 'Product designer', team: 'Design', status: 'away', email: 'ingrid.s@gorg.dev', location: 'Copenhagen', shipped: 38, reviews: 76, tenure: '3y 4m' },
  { id: 5, name: 'Mateo Alvarez', role: 'Design systems', team: 'Design', status: 'active', email: 'mateo.a@gorg.dev', location: 'Valencia', shipped: 55, reviews: 198, tenure: '5y 1m' },
  { id: 6, name: 'Hanae Morioka', role: 'Motion designer', team: 'Design', status: 'focus', email: 'hanae.m@gorg.dev', location: 'Kyoto', shipped: 29, reviews: 44, tenure: '1y 9m' },
  { id: 7, name: 'Nnamdi Okafor', role: 'Analytics engineer', team: 'Data', status: 'active', email: 'nnamdi.o@gorg.dev', location: 'Lagos', shipped: 72, reviews: 151, tenure: '3y 11m' },
  { id: 8, name: 'Elif Demir', role: 'Data platform lead', team: 'Data', status: 'active', email: 'elif.d@gorg.dev', location: 'Istanbul', shipped: 64, reviews: 287, tenure: '4y 8m' },
  { id: 9, name: 'Sofia Petrova', role: 'ML engineer', team: 'Data', status: 'leave', email: 'sofia.p@gorg.dev', location: 'Tbilisi', shipped: 33, reviews: 62, tenure: '2y 1m' },
  { id: 10, name: 'Diego Moreno', role: 'Growth engineer', team: 'Growth', status: 'active', email: 'diego.m@gorg.dev', location: 'Bogotá', shipped: 91, reviews: 88, tenure: '2y 5m' },
  { id: 11, name: 'Yuki Nakamura', role: 'Lifecycle marketing', team: 'Growth', status: 'focus', email: 'yuki.n@gorg.dev', location: 'Osaka', shipped: 26, reviews: 19, tenure: '1y 2m' },
  { id: 12, name: 'Fatima Al-Rashid', role: 'Partnerships', team: 'Growth', status: 'away', email: 'fatima.a@gorg.dev', location: 'Amman', shipped: 18, reviews: 12, tenure: '0y 10m' },
  { id: 13, name: 'Hiroshi Tanaka', role: 'Support lead', team: 'Support', status: 'active', email: 'hiroshi.t@gorg.dev', location: 'Sendai', shipped: 44, reviews: 96, tenure: '5y 6m' },
  { id: 14, name: 'Lucia Ferrari', role: 'Escalation engineer', team: 'Support', status: 'active', email: 'lucia.f@gorg.dev', location: 'Bologna', shipped: 51, reviews: 143, tenure: '3y 0m' },
  { id: 15, name: 'Kwame Boateng', role: 'Support engineer', team: 'Support', status: 'focus', email: 'kwame.b@gorg.dev', location: 'Kumasi', shipped: 37, reviews: 58, tenure: '1y 5m' },
  { id: 16, name: 'Anneke de Vries', role: 'Security engineer', team: 'Platform', status: 'active', email: 'anneke.dv@gorg.dev', location: 'Utrecht', shipped: 40, reviews: 231, tenure: '2y 11m' },
]

/* ------------------------------------------------------------------ *
 * 2 — projects (project grid)
 * ------------------------------------------------------------------ */

export type ProjectStatus = 'on track' | 'at risk' | 'blocked' | 'shipped'
/** Key into a page-local class map — the gradients themselves live in the page. */
export type ProjectAccent = 'tide' | 'ember' | 'ink' | 'info' | 'positive' | 'caution'

export interface ProjectCard {
  id: number
  name: string
  client: string
  summary: string
  status: ProjectStatus
  accent: ProjectAccent
  icon: string
  progress: number
  /** offset from COLLECTION_BASE; negative means the date has passed */
  dueInDays: number
  members: { name: string }[]
  tasks: { done: number, total: number }
}

export const projects: ProjectCard[] = [
  {
    id: 1,
    name: 'Atlas migration',
    client: 'Internal · Platform',
    summary: 'Move the last three services off the shared Postgres cluster.',
    status: 'on track', accent: 'tide', icon: 'lucide:server',
    progress: 68, dueInDays: 21,
    members: [{ name: 'Amara Osei' }, { name: 'Tobias Lindqvist' }, { name: 'Priya Raghunathan' }, { name: 'Anneke de Vries' }, { name: 'Elif Demir' }],
    tasks: { done: 34, total: 50 },
  },
  {
    id: 2,
    name: 'Passkey rollout',
    client: 'Internal · Security',
    summary: 'Replace SMS second factor with platform passkeys for every tier.',
    status: 'at risk', accent: 'ink', icon: 'lucide:key-round',
    progress: 41, dueInDays: 9,
    members: [{ name: 'Anneke de Vries' }, { name: 'Amara Osei' }, { name: 'Hanae Morioka' }],
    tasks: { done: 11, total: 27 },
  },
  {
    id: 3,
    name: 'Northwind portal',
    client: 'Northwind Freight',
    summary: 'Customer-facing shipment tracking with a self-serve billing view.',
    status: 'on track', accent: 'info', icon: 'lucide:truck',
    progress: 82, dueInDays: 4,
    members: [{ name: 'Mateo Alvarez' }, { name: 'Diego Moreno' }, { name: 'Lucia Ferrari' }],
    tasks: { done: 46, total: 56 },
  },
  {
    id: 4,
    name: 'Ledger rewrite',
    client: 'Internal · Finance',
    summary: 'Double-entry ledger with immutable journals and a replay tool.',
    status: 'blocked', accent: 'ember', icon: 'lucide:receipt',
    progress: 23, dueInDays: -6,
    members: [{ name: 'Elif Demir' }, { name: 'Nnamdi Okafor' }],
    tasks: { done: 7, total: 31 },
  },
  {
    id: 5,
    name: 'Design tokens v3',
    client: 'Internal · Design',
    summary: 'One token pipeline feeding web, iOS and the marketing site.',
    status: 'on track', accent: 'tide', icon: 'lucide:palette',
    progress: 57, dueInDays: 33,
    members: [{ name: 'Mateo Alvarez' }, { name: 'Ingrid Sørensen' }, { name: 'Hanae Morioka' }, { name: 'Yuki Nakamura' }],
    tasks: { done: 19, total: 34 },
  },
  {
    id: 6,
    name: 'Meridian analytics',
    client: 'Meridian Health',
    summary: 'Cohort reporting over de-identified patient engagement events.',
    status: 'at risk', accent: 'info', icon: 'lucide:chart-area',
    progress: 35, dueInDays: 12,
    members: [{ name: 'Nnamdi Okafor' }, { name: 'Sofia Petrova' }, { name: 'Elif Demir' }, { name: 'Priya Raghunathan' }, { name: 'Diego Moreno' }, { name: 'Amara Osei' }],
    tasks: { done: 14, total: 40 },
  },
  {
    id: 7,
    name: 'Support inbox triage',
    client: 'Internal · Support',
    summary: 'Auto-routing rules and a first-response SLA dashboard.',
    status: 'shipped', accent: 'positive', icon: 'lucide:inbox',
    progress: 100, dueInDays: -18,
    members: [{ name: 'Hiroshi Tanaka' }, { name: 'Kwame Boateng' }, { name: 'Lucia Ferrari' }],
    tasks: { done: 22, total: 22 },
  },
  {
    id: 8,
    name: 'Onboarding revamp',
    client: 'Internal · Growth',
    summary: 'Six-step activation flow with a measurable drop-off funnel.',
    status: 'on track', accent: 'tide', icon: 'lucide:list-checks',
    progress: 74, dueInDays: 16,
    members: [{ name: 'Diego Moreno' }, { name: 'Yuki Nakamura' }, { name: 'Ingrid Sørensen' }],
    tasks: { done: 29, total: 39 },
  },
  {
    id: 9,
    name: 'Edge cache tier',
    client: 'Internal · Platform',
    summary: 'Regional read-through cache in front of the media pipeline.',
    status: 'shipped', accent: 'ink', icon: 'lucide:globe',
    progress: 100, dueInDays: -41,
    members: [{ name: 'Tobias Lindqvist' }, { name: 'Priya Raghunathan' }],
    tasks: { done: 18, total: 18 },
  },
]

/* ------------------------------------------------------------------ *
 * 3 — release runs (dense list view)
 * ------------------------------------------------------------------ */

export type RunStatus = 'passed' | 'running' | 'failed' | 'queued'
export type RunEnv = 'production' | 'staging' | 'preview'

export interface ReleaseRun {
  id: string
  title: string
  branch: string
  author: string
  env: RunEnv
  status: RunStatus
  /** wall-clock, already formatted */
  duration: string
  /** negative offset from COLLECTION_BASE */
  ranDaysAgo: number
  changes: number
}

export const releaseRuns: ReleaseRun[] = [
  { id: 'r-4812', title: 'Switch rate limiter to a monotonic clock', branch: 'fix/rate-limit-clock', author: 'Tobias Lindqvist', env: 'production', status: 'passed', duration: '6m 12s', ranDaysAgo: 0, changes: 14 },
  { id: 'r-4811', title: 'Passkey enrolment: handle cross-device fallback', branch: 'feat/passkey-xdevice', author: 'Anneke de Vries', env: 'staging', status: 'running', duration: '2m 40s', ranDaysAgo: 0, changes: 31 },
  { id: 'r-4810', title: 'Ledger journal replay CLI', branch: 'feat/ledger-replay', author: 'Elif Demir', env: 'preview', status: 'failed', duration: '1m 05s', ranDaysAgo: -1, changes: 62 },
  { id: 'r-4809', title: 'Token pipeline: emit iOS colour sets', branch: 'feat/tokens-ios', author: 'Mateo Alvarez', env: 'preview', status: 'passed', duration: '3m 51s', ranDaysAgo: -1, changes: 9 },
  { id: 'r-4808', title: 'Drop the v1 webhook delivery worker', branch: 'chore/webhooks-v1-sunset', author: 'Amara Osei', env: 'production', status: 'passed', duration: '8m 04s', ranDaysAgo: -2, changes: 47 },
  { id: 'r-4807', title: 'Cohort query planner rewrite', branch: 'feat/cohort-planner', author: 'Nnamdi Okafor', env: 'staging', status: 'queued', duration: '—', ranDaysAgo: -2, changes: 88 },
  { id: 'r-4806', title: 'Shipment tracker: optimistic status updates', branch: 'feat/tracker-optimistic', author: 'Diego Moreno', env: 'preview', status: 'passed', duration: '2m 19s', ranDaysAgo: -3, changes: 23 },
  { id: 'r-4805', title: 'Escalation SLA timers respect holidays', branch: 'fix/sla-holidays', author: 'Lucia Ferrari', env: 'production', status: 'failed', duration: '4m 33s', ranDaysAgo: -4, changes: 11 },
  { id: 'r-4804', title: 'Media pipeline: regional cache warmers', branch: 'feat/edge-warmers', author: 'Priya Raghunathan', env: 'production', status: 'passed', duration: '11m 27s', ranDaysAgo: -5, changes: 35 },
  { id: 'r-4803', title: 'Activation funnel events', branch: 'feat/activation-events', author: 'Yuki Nakamura', env: 'staging', status: 'passed', duration: '3m 08s', ranDaysAgo: -6, changes: 17 },
  { id: 'r-4802', title: 'Motion tokens for the sidebar rail', branch: 'feat/motion-rail', author: 'Hanae Morioka', env: 'preview', status: 'passed', duration: '1m 44s', ranDaysAgo: -8, changes: 6 },
  { id: 'r-4801', title: 'Quarterly access review export', branch: 'chore/access-review', author: 'Fatima Al-Rashid', env: 'staging', status: 'passed', duration: '5m 02s', ranDaysAgo: -9, changes: 28 },
]

/* ------------------------------------------------------------------ *
 * 4 — library entries (media list)
 * ------------------------------------------------------------------ */

export type MediaKind = 'article' | 'guide' | 'recording' | 'dataset'

export interface MediaItem {
  id: number
  title: string
  excerpt: string
  kind: MediaKind
  tags: string[]
  author: string
  publishedDaysAgo: number
  readMinutes: number
  views: number
  comments: number
}

export const mediaLibrary: MediaItem[] = [
  {
    id: 1,
    title: 'Postmortem: INC-2210, the retry storm that ate a region',
    excerpt: 'A single missing jitter term turned a routine failover into forty minutes of amplification. Here is the timeline, the graphs we misread, and the three guardrails we shipped afterwards.',
    kind: 'article', tags: ['incident', 'reliability'], author: 'Priya Raghunathan',
    publishedDaysAgo: -2, readMinutes: 11, views: 4820, comments: 37,
  },
  {
    id: 2,
    title: 'Designing tokens that survive three platforms',
    excerpt: 'Web, iOS and the marketing site all wanted their own colour names. We gave them one source of truth and a build step that refuses to guess.',
    kind: 'guide', tags: ['design', 'tokens'], author: 'Mateo Alvarez',
    publishedDaysAgo: -5, readMinutes: 8, views: 3110, comments: 22,
  },
  {
    id: 3,
    title: 'Engineering all-hands — Q3 platform review',
    excerpt: 'Forty minutes on the Atlas migration, the edge cache numbers, and what the next two quarters of capacity planning look like.',
    kind: 'recording', tags: ['platform', 'internal'], author: 'Tobias Lindqvist',
    publishedDaysAgo: -7, readMinutes: 42, views: 1290, comments: 8,
  },
  {
    id: 4,
    title: 'Activation funnel, weeks 1–36',
    excerpt: 'Per-step drop-off for every onboarding cohort this year, with the experiment flags attached so you can slice by variant.',
    kind: 'dataset', tags: ['growth', 'analytics'], author: 'Diego Moreno',
    publishedDaysAgo: -9, readMinutes: 4, views: 970, comments: 5,
  },
  {
    id: 5,
    title: 'Passkeys without the support queue',
    excerpt: 'Every fallback path we had to build so that losing a phone does not mean losing an account — and the copy that stopped the tickets.',
    kind: 'guide', tags: ['security', 'support'], author: 'Anneke de Vries',
    publishedDaysAgo: -12, readMinutes: 14, views: 6240, comments: 51,
  },
  {
    id: 6,
    title: 'What a double-entry ledger buys you',
    excerpt: 'We spent a quarter replacing a balance column with immutable journals. The reconciliation story alone paid for it.',
    kind: 'article', tags: ['finance', 'architecture'], author: 'Elif Demir',
    publishedDaysAgo: -16, readMinutes: 9, views: 2410, comments: 19,
  },
  {
    id: 7,
    title: 'Support triage rules, annotated',
    excerpt: 'The full routing ruleset behind the new inbox, with a note on every rule explaining which escalation it was written to prevent.',
    kind: 'guide', tags: ['support', 'process'], author: 'Hiroshi Tanaka',
    publishedDaysAgo: -21, readMinutes: 6, views: 1480, comments: 11,
  },
  {
    id: 8,
    title: 'Edge cache hit rates by region',
    excerpt: 'Ninety days of hit, miss and revalidation counts for every point of presence, bucketed hourly and safe to share externally.',
    kind: 'dataset', tags: ['platform', 'performance'], author: 'Amara Osei',
    publishedDaysAgo: -28, readMinutes: 3, views: 860, comments: 3,
  },
  {
    id: 9,
    title: 'Motion that explains instead of decorates',
    excerpt: 'A short tour of the entrance, reveal and counter primitives, and the one rule we apply before adding any new animation.',
    kind: 'recording', tags: ['design', 'motion'], author: 'Hanae Morioka',
    publishedDaysAgo: -34, readMinutes: 18, views: 2050, comments: 14,
  },
]

/* ------------------------------------------------------------------ *
 * 5 — integrations (tile grid)
 * ------------------------------------------------------------------ */

export type IntegrationCategory = 'Communication' | 'Developer' | 'Analytics' | 'Finance' | 'Storage'

export interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: IntegrationCategory
  enabled: boolean
  note?: 'new' | 'beta'
}

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = ['Communication', 'Developer', 'Analytics', 'Finance', 'Storage']

export const integrations: Integration[] = [
  { id: 'threads', name: 'Threads', description: 'Post release notes into a channel.', icon: 'lucide:message-square', category: 'Communication', enabled: true },
  { id: 'mailroom', name: 'Mailroom', description: 'Transactional email with delivery logs.', icon: 'lucide:mail', category: 'Communication', enabled: true },
  { id: 'paging', name: 'Paging', description: 'On-call rotations and escalation policies.', icon: 'lucide:bell-ring', category: 'Communication', enabled: false, note: 'new' },
  { id: 'meetly', name: 'Meetly', description: 'Drop a call link into any incident.', icon: 'lucide:video', category: 'Communication', enabled: false },

  { id: 'forge', name: 'Forge', description: 'Pull requests, checks and merge queues.', icon: 'lucide:git-branch', category: 'Developer', enabled: true },
  { id: 'sentry-lite', name: 'Traceback', description: 'Group exceptions by release and owner.', icon: 'lucide:bug', category: 'Developer', enabled: true },
  { id: 'hooks', name: 'Webhooks', description: 'Signed outbound events with replay.', icon: 'lucide:webhook', category: 'Developer', enabled: false },
  { id: 'shell', name: 'Runbooks', description: 'Executable operational playbooks.', icon: 'lucide:terminal', category: 'Developer', enabled: false, note: 'beta' },
  { id: 'registry', name: 'Registry', description: 'Container images and provenance.', icon: 'lucide:package', category: 'Developer', enabled: true },

  { id: 'lens', name: 'Lens', description: 'Product analytics and funnels.', icon: 'lucide:chart-line', category: 'Analytics', enabled: true },
  { id: 'warehouse', name: 'Warehouse sync', description: 'Nightly export to your own database.', icon: 'lucide:database', category: 'Analytics', enabled: false },
  { id: 'pulse', name: 'Pulse', description: 'Uptime probes from nine regions.', icon: 'lucide:activity', category: 'Analytics', enabled: true },
  { id: 'heatmaps', name: 'Heatmaps', description: 'Session replay with field masking.', icon: 'lucide:scan-eye', category: 'Analytics', enabled: false, note: 'beta' },

  { id: 'ledger', name: 'Ledger', description: 'Double-entry journals and reconciliation.', icon: 'lucide:receipt', category: 'Finance', enabled: true },
  { id: 'billing', name: 'Card billing', description: 'Subscriptions, proration and dunning.', icon: 'lucide:credit-card', category: 'Finance', enabled: true },
  { id: 'taxes', name: 'Tax engine', description: 'Rates and filing thresholds by region.', icon: 'lucide:landmark', category: 'Finance', enabled: false },

  { id: 'vault', name: 'Vault', description: 'Secrets with short-lived leases.', icon: 'lucide:key-round', category: 'Storage', enabled: true },
  { id: 'buckets', name: 'Object store', description: 'Durable blobs with lifecycle rules.', icon: 'lucide:hard-drive', category: 'Storage', enabled: false },
  { id: 'archive', name: 'Cold archive', description: 'Cheap retention for audit exports.', icon: 'lucide:archive', category: 'Storage', enabled: false },
]
