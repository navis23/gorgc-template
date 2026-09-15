/**
 * Deterministic sample data for the record / detail layout pages.
 *
 * Kept apart from `mock.ts` so the two demo sets never tread on each other.
 * Every timestamp is derived from a fixed base and read with `getUTC*`, so the
 * server and the browser render byte-identical markup — no hydration drift,
 * no `Math.random()`, no `new Date()` at module scope.
 */

/** The demo "today": 15 September 2026, UTC. */
export const BASE_DAY = Date.UTC(2026, 8, 15)

const DAY_MS = 86_400_000

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** A point in time relative to the demo base, in UTC. */
export function dayAt(days: number, hour = 9, minute = 0): Date {
  return new Date(BASE_DAY + days * DAY_MS + hour * 3_600_000 + minute * 60_000)
}

function pad(value: number) {
  return value < 10 ? `0${value}` : String(value)
}

/** `15 Sep 2026` */
export function formatDay(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** `15 Sep 2026 · 09:40` */
export function formatDayTime(date: Date): string {
  return `${formatDay(date)} · ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

/** Human distance from the demo base — "3 days ago", "in 2 weeks", "today". */
export function fromBase(date: Date): string {
  const days = Math.round((date.getTime() - BASE_DAY) / DAY_MS)
  if (days === 0)
    return 'today'
  if (days === -1)
    return 'yesterday'
  if (days === 1)
    return 'tomorrow'

  const span = Math.abs(days)
  const unit = span < 14
    ? `${span} days`
    : span < 60
      ? `${Math.round(span / 7)} weeks`
      : `${Math.round(span / 30)} months`

  return days < 0 ? `${unit} ago` : `in ${unit}`
}

/**
 * Cents → `$1,240.00`. Integer cents everywhere keeps the arithmetic exact,
 * and the grouping is done by hand rather than through `toLocaleString`, whose
 * output depends on the ICU data the runtime happens to ship — a classic way
 * to make the server and the browser disagree about a string.
 */
export function formatCents(cents: number, currency = '$'): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}${currency}${whole}.${pad(abs % 100)}`
}

/* ---------------------------------------------------------------------------
   Profile — /layouts/profile and /layouts/profile-edit
--------------------------------------------------------------------------- */

export interface ProfileStat {
  key: string
  label: string
  value: string
  hint: string
  icon: string
}

export interface ProfileSkill {
  label: string
  /** How central this is to the person's day job — drives badge tone. */
  depth: 'core' | 'working' | 'learning'
}

export interface ActivityEntry {
  id: number
  icon: string
  tone: 'brand' | 'accent' | 'positive' | 'caution' | 'info' | 'neutral'
  title: string
  detail: string
  at: string
}

export interface ProfileProject {
  id: string
  name: string
  summary: string
  role: string
  progress: number
  status: 'shipped' | 'active' | 'paused'
  members: string[]
}

export interface ProfileFile {
  id: string
  name: string
  kind: string
  icon: string
  size: string
  at: string
}

export interface ProfileLink {
  label: string
  href: string
  icon: string
}

export const profile = {
  name: 'Noor Abdel-Rahim',
  handle: 'noor',
  pronouns: 'she/her',
  role: 'Staff Design Engineer',
  team: 'Design Systems',
  location: 'Rotterdam, Netherlands',
  timezone: 'Europe/Amsterdam',
  joined: formatDay(dayAt(-1_146)),
  status: 'online' as const,
  availability: 'Open to reviews · slow on Fridays',
  bio: [
    'I sit between design and engineering and try to make that seam invisible. '
    + 'Most of my week goes into the Atlas token pipeline — the thing that turns a '
    + 'Figma variable into a shipped CSS custom property without anyone hand-copying a hex.',
    'Before this I spent six years on accessibility tooling, which is why every component '
    + 'I touch ends up with a focus ring argument attached to it. Ask me about reduced motion.',
  ],
  links: [
    { label: 'noor.build', href: '#', icon: 'lucide:globe' },
    { label: '@noor', href: '#', icon: 'lucide:at-sign' },
    { label: 'noor/atlas', href: '#', icon: 'lucide:git-branch' },
  ] satisfies ProfileLink[],
}

export const profileStats: ProfileStat[] = [
  { key: 'shipped', label: 'Projects shipped', value: '34', hint: 'since joining', icon: 'lucide:rocket' },
  { key: 'reviews', label: 'Reviews given', value: '218', hint: 'last 12 months', icon: 'lucide:git-pull-request' },
  { key: 'owned', label: 'Components owned', value: '12', hint: 'in the Atlas kit', icon: 'lucide:box' },
  { key: 'response', label: 'Median reply', value: '3h', hint: 'on open threads', icon: 'lucide:message-circle' },
]

export const profileSkills: ProfileSkill[] = [
  { label: 'Design systems', depth: 'core' },
  { label: 'Vue & Nuxt', depth: 'core' },
  { label: 'TypeScript', depth: 'core' },
  { label: 'Accessibility (WCAG 2.2)', depth: 'core' },
  { label: 'CSS architecture', depth: 'working' },
  { label: 'Motion & GSAP', depth: 'working' },
  { label: 'Figma variables', depth: 'working' },
  { label: 'Postgres', depth: 'working' },
  { label: 'Rust', depth: 'learning' },
  { label: 'WebGPU', depth: 'learning' },
]

export const profileActivity: ActivityEntry[] = [
  {
    id: 1,
    icon: 'lucide:git-merge',
    tone: 'brand',
    title: 'Merged “Token pipeline: emit dark variants”',
    detail: 'atlas-tokens · 14 files changed, 3 reviewers',
    at: `${formatDayTime(dayAt(0, 8, 40))} · ${fromBase(dayAt(0))}`,
  },
  {
    id: 2,
    icon: 'lucide:message-square',
    tone: 'info',
    title: 'Left 9 comments on “Invoice detail redesign”',
    detail: 'Mostly about focus order in the line-item table',
    at: `${formatDayTime(dayAt(-1, 16, 5))} · ${fromBase(dayAt(-1))}`,
  },
  {
    id: 3,
    icon: 'lucide:badge-check',
    tone: 'positive',
    title: 'Closed accessibility audit AUD-41',
    detail: 'All 23 findings resolved; two waived with rationale',
    at: `${formatDayTime(dayAt(-4, 11, 20))} · ${fromBase(dayAt(-4))}`,
  },
  {
    id: 4,
    icon: 'lucide:presentation',
    tone: 'accent',
    title: 'Ran the guild session on reduced motion',
    detail: '41 attendees · recording in the Files tab',
    at: `${formatDayTime(dayAt(-8, 13, 0))} · ${fromBase(dayAt(-8))}`,
  },
  {
    id: 5,
    icon: 'lucide:triangle-alert',
    tone: 'caution',
    title: 'Flagged a contrast regression in the caution palette',
    detail: 'Reverted before it reached the release branch',
    at: `${formatDayTime(dayAt(-13, 9, 15))} · ${fromBase(dayAt(-13))}`,
  },
  {
    id: 6,
    icon: 'lucide:user-plus',
    tone: 'neutral',
    title: 'Onboarded Dilan Ergün to the systems rota',
    detail: 'Paired for a week on the component review queue',
    at: `${formatDayTime(dayAt(-21, 10, 30))} · ${fromBase(dayAt(-21))}`,
  },
]

export const profileProjects: ProfileProject[] = [
  {
    id: 'ATL-114',
    name: 'Atlas design tokens',
    summary: 'One source of truth for colour, radius and motion across six products.',
    role: 'Lead',
    progress: 72,
    status: 'active',
    members: ['Noor Abdel-Rahim', 'Casper Nørgaard', 'Rosa Betancourt', 'Hiro Tanabe'],
  },
  {
    id: 'A11Y-08',
    name: 'Keyboard-first audit',
    summary: 'Every interactive surface reachable and operable without a pointer.',
    role: 'Reviewer',
    progress: 100,
    status: 'shipped',
    members: ['Rosa Betancourt', 'Noor Abdel-Rahim'],
  },
  {
    id: 'MOT-02',
    name: 'Motion language v2',
    summary: 'Shared easing curves and durations, honouring reduced-motion by default.',
    role: 'Lead',
    progress: 45,
    status: 'active',
    members: ['Noor Abdel-Rahim', 'Hiro Tanabe'],
  },
  {
    id: 'DOC-19',
    name: 'Component docs rewrite',
    summary: 'Props, states and do/don’t pairs for all 85 components.',
    role: 'Contributor',
    progress: 20,
    status: 'paused',
    members: ['Dilan Ergün', 'Noor Abdel-Rahim', 'Casper Nørgaard'],
  },
]

export const profileFiles: ProfileFile[] = [
  { id: 'f1', name: 'atlas-tokens-v3.json', kind: 'Token export', icon: 'lucide:file-json', size: '184 KB', at: formatDay(dayAt(0)) },
  { id: 'f2', name: 'reduced-motion-session.mp4', kind: 'Recording', icon: 'lucide:file-video', size: '412 MB', at: formatDay(dayAt(-8)) },
  { id: 'f3', name: 'contrast-matrix.csv', kind: 'Spreadsheet', icon: 'lucide:file-spreadsheet', size: '22 KB', at: formatDay(dayAt(-13)) },
  { id: 'f4', name: 'audit-AUD-41.pdf', kind: 'Report', icon: 'lucide:file-text', size: '1.8 MB', at: formatDay(dayAt(-4)) },
  { id: 'f5', name: 'focus-ring-explorations.fig', kind: 'Design file', icon: 'lucide:file-image', size: '9.4 MB', at: formatDay(dayAt(-26)) },
  { id: 'f6', name: 'onboarding-checklist.md', kind: 'Document', icon: 'lucide:file-code', size: '6 KB', at: formatDay(dayAt(-21)) },
]

/* ---------------------------------------------------------------------------
   Record detail — /layouts/record-detail
--------------------------------------------------------------------------- */

export interface RecordMilestone {
  id: string
  label: string
  detail: string
  due: string
  done: boolean
  owner: string
}

export interface RecordComment {
  id: number
  author: string
  role: string
  body: string
  at: string
  pinned?: boolean
}

export interface LinkedItem {
  id: string
  label: string
  kind: 'pull request' | 'issue' | 'document' | 'design'
  icon: string
  state: 'open' | 'merged' | 'closed' | 'draft'
}

export const record = {
  id: 'ATL-114',
  title: 'Atlas design tokens',
  subtitle: 'Ship one token pipeline for all six product surfaces',
  status: 'in progress' as const,
  priority: 'high' as const,
  owner: { name: 'Noor Abdel-Rahim', role: 'Staff Design Engineer' },
  reporter: { name: 'Rosa Betancourt', role: 'Head of Design' },
  created: formatDay(dayAt(-96)),
  updated: `${formatDayTime(dayAt(0, 8, 40))} · ${fromBase(dayAt(0))}`,
  due: `${formatDay(dayAt(24))} · ${fromBase(dayAt(24))}`,
  estimate: '18 days remaining',
  tags: ['design-system', 'tokens', 'accessibility', 'build-pipeline'],
  description: [
    'Today every product re-declares its own colours. Six teams, six palettes, '
    + 'four of which disagree about what “caution” means. This record covers building '
    + 'the pipeline that reads Figma variables once and emits typed CSS custom properties, '
    + 'plus the migration of the first three consumers.',
    'Scope explicitly excludes typography scales — those are tracked separately in TYP-3 '
    + 'and should not block this work. The acceptance bar is that a designer can rename a '
    + 'token in Figma and see it land in a preview build without an engineer touching a file.',
  ],
  watchers: ['Casper Nørgaard', 'Hiro Tanabe', 'Dilan Ergün', 'Rosa Betancourt', 'Marcus Webb'],
}

export const milestones: RecordMilestone[] = [
  { id: 'm1', label: 'Audit existing palettes', detail: 'All six products catalogued into one sheet', due: formatDay(dayAt(-74)), done: true, owner: 'Rosa Betancourt' },
  { id: 'm2', label: 'Agree the semantic layer', detail: 'surface / text / status roles signed off', due: formatDay(dayAt(-52)), done: true, owner: 'Noor Abdel-Rahim' },
  { id: 'm3', label: 'Build the Figma exporter', detail: 'Variables → JSON, running in CI nightly', due: formatDay(dayAt(-18)), done: true, owner: 'Hiro Tanabe' },
  { id: 'm4', label: 'Emit dark-mode variants', detail: 'Independently chosen steps, not a lightness flip', due: formatDay(dayAt(2)), done: false, owner: 'Noor Abdel-Rahim' },
  { id: 'm5', label: 'Migrate the admin surface', detail: 'First real consumer, behind a flag', due: formatDay(dayAt(12)), done: false, owner: 'Casper Nørgaard' },
  { id: 'm6', label: 'Contrast regression gate', detail: 'CI fails the build on a WCAG drop', due: formatDay(dayAt(24)), done: false, owner: 'Dilan Ergün' },
]

export const recordComments: RecordComment[] = [
  {
    id: 1,
    author: 'Rosa Betancourt',
    role: 'Head of Design',
    body: 'Pinning this: the acceptance bar is the rename-in-Figma round trip. If that still needs '
      + 'an engineer at the end of the quarter, we have not shipped it, however good the JSON looks.',
    at: `${formatDayTime(dayAt(-30, 10, 0))} · ${fromBase(dayAt(-30))}`,
    pinned: true,
  },
  {
    id: 2,
    author: 'Hiro Tanabe',
    role: 'Platform Engineer',
    body: 'Exporter is green in CI. One caveat — Figma rate-limits us at about 40 requests a minute, '
      + 'so the nightly job batches by collection rather than by variable. Slower, but it stops flaking.',
    at: `${formatDayTime(dayAt(-16, 15, 25))} · ${fromBase(dayAt(-16))}`,
  },
  {
    id: 3,
    author: 'Casper Nørgaard',
    role: 'Frontend Engineer',
    body: 'Started the admin migration on a branch. The only genuinely painful part is the four places '
      + 'that read a hex out of a data attribute. I would rather fix those than shim them.',
    at: `${formatDayTime(dayAt(-6, 9, 5))} · ${fromBase(dayAt(-6))}`,
  },
  {
    id: 4,
    author: 'Noor Abdel-Rahim',
    role: 'Staff Design Engineer',
    body: 'Agreed, fix them. I pushed the dark variants this morning — every step was chosen against '
      + 'its own surface rather than flipped, so please eyeball the caution ramp before it lands.',
    at: `${formatDayTime(dayAt(0, 8, 52))} · ${fromBase(dayAt(0))}`,
  },
]

export const linkedItems: LinkedItem[] = [
  { id: 'PR-2291', label: 'Token pipeline: emit dark variants', kind: 'pull request', icon: 'lucide:git-pull-request', state: 'merged' },
  { id: 'PR-2304', label: 'Admin surface migration (flagged)', kind: 'pull request', icon: 'lucide:git-pull-request', state: 'draft' },
  { id: 'ISS-881', label: 'Caution ramp fails AA on sunken', kind: 'issue', icon: 'lucide:circle-dot', state: 'open' },
  { id: 'DOC-12', label: 'Semantic layer decision record', kind: 'document', icon: 'lucide:file-text', state: 'closed' },
  { id: 'FIG-07', label: 'Atlas variables — source of truth', kind: 'design', icon: 'lucide:frame', state: 'open' },
]

/* ---------------------------------------------------------------------------
   Invoice — /layouts/invoice
--------------------------------------------------------------------------- */

export interface LineItem {
  id: string
  description: string
  detail: string
  quantity: number
  unit: string
  /** Integer cents — float money is a bug waiting for a rounding error. */
  unitPrice: number
}

export interface InvoiceEvent {
  id: string
  label: string
  detail: string
  at: string
  icon: string
  tone: 'neutral' | 'info' | 'brand' | 'positive' | 'caution'
}

export const invoice = {
  number: 'INV-2087',
  reference: 'PO 4417-NB',
  issued: formatDay(dayAt(-12)),
  due: formatDay(dayAt(18)),
  terms: 'Net 30',
  currency: '$',
  taxLabel: 'VAT (21%)',
  taxRate: 0.21,
  notes: 'Payment by bank transfer only. Quote the invoice number as the payment reference '
    + 'so reconciliation does not fall to a human on a Friday afternoon.',
  issuer: {
    name: 'Gorg Systems BV',
    lines: ['Keilewerf 3', '3029 BS Rotterdam', 'Netherlands'],
    meta: [
      { label: 'VAT', value: 'NL8241.55.901B01' },
      { label: 'IBAN', value: 'NL18 ABNA 0412 7739 24' },
      { label: 'Email', value: 'billing@gorgsystems.example' },
    ],
  },
  recipient: {
    name: 'Northbank Collective',
    lines: ['Attn. Marcus Webb', '18 Tanner Row', 'York YO1 6JT', 'United Kingdom'],
    meta: [
      { label: 'VAT', value: 'GB 442 8871 03' },
      { label: 'Contact', value: 'accounts@northbank.example' },
    ],
  },
}

export const lineItems: LineItem[] = [
  { id: 'l1', description: 'Design system audit', detail: 'Six surfaces, written findings and a migration order', quantity: 1, unit: 'engagement', unitPrice: 480_000 },
  { id: 'l2', description: 'Token pipeline build', detail: 'Figma export → typed CSS custom properties, CI wired', quantity: 12, unit: 'day', unitPrice: 95_000 },
  { id: 'l3', description: 'Accessibility remediation', detail: 'Focus order, contrast, reduced-motion pass', quantity: 6, unit: 'day', unitPrice: 95_000 },
  { id: 'l4', description: 'Component documentation', detail: 'Props, states and usage pairs for 85 components', quantity: 3, unit: 'day', unitPrice: 78_000 },
  { id: 'l5', description: 'Handover workshop', detail: 'Half-day session, recorded, plus a runbook', quantity: 2, unit: 'session', unitPrice: 42_000 },
]

/** Fixed part of the story; "paid" is appended at runtime by the toolbar. */
export const invoiceEvents: InvoiceEvent[] = [
  { id: 'e1', label: 'Drafted', detail: 'Prepared by Rosa Betancourt', at: formatDayTime(dayAt(-15, 14, 10)), icon: 'lucide:file-pen', tone: 'neutral' },
  { id: 'e2', label: 'Issued', detail: 'Sent to accounts@northbank.example', at: formatDayTime(dayAt(-12, 9, 0)), icon: 'lucide:send', tone: 'brand' },
  { id: 'e3', label: 'Opened', detail: 'Viewed twice by Marcus Webb', at: formatDayTime(dayAt(-11, 11, 42)), icon: 'lucide:mail-open', tone: 'info' },
  { id: 'e4', label: 'Reminder sent', detail: 'Automatic nudge, 14 days before due', at: formatDayTime(dayAt(-4, 8, 0)), icon: 'lucide:bell-ring', tone: 'caution' },
]

/* ---------------------------------------------------------------------------
   Pricing — /layouts/pricing
--------------------------------------------------------------------------- */

export interface Plan {
  id: 'solo' | 'team' | 'scale'
  name: string
  tagline: string
  /** Cents per seat per month, billed monthly. */
  monthly: number
  /** Cents per seat per month when the year is paid up front. */
  annualMonthly: number
  seats: string
  popular?: boolean
  highlights: string[]
  cta: string
}

export const plans: Plan[] = [
  {
    id: 'solo',
    name: 'Solo',
    tagline: 'One designer, one repo, no committee.',
    monthly: 1_900,
    annualMonthly: 1_500,
    seats: 'Up to 3 seats',
    highlights: [
      'All 85 components',
      'Light and dark tokens',
      'Community support',
      '1 production project',
    ],
    cta: 'Start free trial',
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'The one most teams land on after the trial.',
    monthly: 4_900,
    annualMonthly: 3_900,
    seats: 'Up to 25 seats',
    popular: true,
    highlights: [
      'Everything in Solo',
      'Figma variable sync',
      'CI contrast gate',
      'Unlimited projects',
      'Email support, 1 business day',
    ],
    cta: 'Start free trial',
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Several products, one design language, an audit trail.',
    monthly: 12_900,
    annualMonthly: 10_300,
    seats: 'Unlimited seats',
    highlights: [
      'Everything in Team',
      'SSO and SCIM provisioning',
      'Private component registry',
      'Accessibility audit each quarter',
      'Named engineer, 4-hour response',
    ],
    cta: 'Talk to sales',
  },
]

export interface FeatureRow {
  group: string
  label: string
  detail?: string
  /** `true`/`false` render as a tick or cross; a string renders as text. */
  values: Record<Plan['id'], boolean | string>
}

export const featureMatrix: FeatureRow[] = [
  { group: 'Library', label: 'Components', values: { solo: 'All 85', team: 'All 85', scale: 'All 85 + private' } },
  { group: 'Library', label: 'Production projects', values: { solo: '1', team: 'Unlimited', scale: 'Unlimited' } },
  { group: 'Library', label: 'Private component registry', detail: 'Publish your own components alongside ours', values: { solo: false, team: false, scale: true } },

  { group: 'Design workflow', label: 'Light and dark tokens', values: { solo: true, team: true, scale: true } },
  { group: 'Design workflow', label: 'Figma variable sync', detail: 'Rename in Figma, land in a preview build', values: { solo: false, team: true, scale: true } },
  { group: 'Design workflow', label: 'Brand theme builder', values: { solo: false, team: true, scale: true } },

  { group: 'Quality gates', label: 'CI contrast gate', detail: 'Fails the build on a WCAG regression', values: { solo: false, team: true, scale: true } },
  { group: 'Quality gates', label: 'Accessibility audit', values: { solo: false, team: 'On request', scale: 'Every quarter' } },
  { group: 'Quality gates', label: 'Reduced-motion coverage', values: { solo: true, team: true, scale: true } },

  { group: 'Administration', label: 'SSO and SCIM', values: { solo: false, team: false, scale: true } },
  { group: 'Administration', label: 'Audit log retention', values: { solo: '7 days', team: '90 days', scale: '2 years' } },
  { group: 'Administration', label: 'Support response', values: { solo: 'Community', team: '1 business day', scale: '4 hours, named engineer' } },
]

export interface Faq {
  id: string
  question: string
  answer: string
}

export const pricingFaqs: Faq[] = [
  {
    id: 'faq-billing',
    question: 'What actually changes when I switch to annual billing?',
    answer: 'You pay twelve months up front and the per-seat rate drops by roughly a fifth — two months '
      + 'free, in the usual framing. Nothing about the product changes. Switching mid-term prorates the '
      + 'remaining balance onto the next invoice rather than refunding it.',
  },
  {
    id: 'faq-seats',
    question: 'How are seats counted?',
    answer: 'A seat is a person who can open the workspace in a given month. Viewers who only read '
      + 'published documentation are free and unlimited. Removing someone frees the seat immediately; '
      + 'we do not bill for the rest of the month.',
  },
  {
    id: 'faq-trial',
    question: 'Is the trial crippled in any way?',
    answer: 'No. The 14-day trial runs on the Team plan with every feature on, including Figma sync and '
      + 'the CI contrast gate. We do not ask for a card up front, which means we also cannot silently '
      + 'convert you at the end of it.',
  },
  {
    id: 'faq-downgrade',
    question: 'What happens to my work if I downgrade?',
    answer: 'Nothing is deleted. Projects beyond the new plan limit go read-only rather than disappearing, '
      + 'and your token exports keep running. Upgrade again and everything unlocks exactly where it was.',
  },
  {
    id: 'faq-selfhost',
    question: 'Can we self-host the registry?',
    answer: 'On Scale, yes — the private registry ships as a container you can run inside your own network, '
      + 'with the licence check done offline against a signed key. Solo and Team are hosted only.',
  },
  {
    id: 'faq-nonprofit',
    question: 'Do you discount for non-profits and education?',
    answer: 'Half price on any plan for registered non-profits, accredited schools and student groups. '
      + 'Send proof of status from an institutional address and we apply it to the account, not a coupon '
      + 'that expires when you forget about it.',
  },
]
