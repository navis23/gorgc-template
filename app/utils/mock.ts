import {
  isoDay,
  monthDayLabel,
  MONTHS_SHORT,
  weekdayLabel,
  WEEKDAYS_SHORT,
} from '~/utils/datetime'

/**
 * Deterministic sample data for the demo pages.
 * Seeded so SSR and client render identical markup (no hydration drift).
 */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const rand = seeded(20260915)

export function walk(n: number, start = 100, drift = 0.02, vol = 0.08) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(1, v * (1 + drift + (rand() - 0.5) * vol))
    out.push(Math.round(v * 100) / 100)
  }
  return out
}

/** Chart axis labels. Aliases the canonical arrays in datetime.ts. */
export const MONTHS = MONTHS_SHORT
export const WEEKDAYS = WEEKDAYS_SHORT

export const revenueSeries = [
  { name: 'Subscriptions', data: walk(12, 42000, 0.03, 0.10).map(Math.round) },
  { name: 'Services', data: walk(12, 28000, 0.02, 0.14).map(Math.round) },
  { name: 'Marketplace', data: walk(12, 15000, 0.04, 0.18).map(Math.round) },
]

export const trafficSeries = [
  { name: 'Direct', data: walk(7, 3200, 0.01, 0.2).map(Math.round) },
  { name: 'Organic', data: walk(7, 5400, 0.01, 0.15).map(Math.round) },
  { name: 'Referral', data: walk(7, 1800, 0.01, 0.25).map(Math.round) },
]

export const channelSplit = [
  { name: 'Organic', value: 4210 },
  { name: 'Paid', value: 2870 },
  { name: 'Referral', value: 1640 },
  { name: 'Social', value: 1120 },
  { name: 'Email', value: 760 },
]

export interface Member {
  id: number
  name: string
  email: string
  role: string
  team: string
  status: 'active' | 'invited' | 'suspended'
  usage: number
  joined: string
}

const NAMES = [
  'Amara Osei', 'Tobias Lindqvist', 'Priya Raghunathan', 'Marcus Webb',
  'Lena Kowalski', 'Hiroshi Tanaka', 'Fatima Al-Rashid', 'Diego Moreno',
  'Siobhan Carroll', 'Nnamdi Okafor', 'Elif Demir', 'Rustam Iskandarov',
  'Clara Beaumont', 'Yusuf Adeyemi', 'Ingrid Sørensen', 'Rafael Costa',
]
const ROLES = ['Owner', 'Admin', 'Engineer', 'Analyst', 'Designer', 'Viewer']
const TEAMS = ['Platform', 'Growth', 'Data', 'Design', 'Support']
const STATUSES: Member['status'][] = ['active', 'active', 'active', 'invited', 'suspended']

export const members: Member[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  role: ROLES[i % ROLES.length]!,
  team: TEAMS[i % TEAMS.length]!,
  status: STATUSES[i % STATUSES.length]!,
  usage: Math.round(rand() * 100),
  joined: new Date(2024, i % 12, ((i * 7) % 27) + 1).toISOString().slice(0, 10),
}))

export interface Activity {
  id: number
  actor: string
  action: string
  target: string
  at: string
}

export const activity: Activity[] = [
  { id: 1, actor: 'Amara Osei', action: 'deployed', target: 'api-gateway v2.14.0', at: '4m ago' },
  { id: 2, actor: 'Tobias Lindqvist', action: 'merged', target: 'PR #4821 — rate limiter', at: '22m ago' },
  { id: 3, actor: 'Priya Raghunathan', action: 'opened', target: 'incident INC-2210', at: '1h ago' },
  { id: 4, actor: 'Marcus Webb', action: 'invited', target: 'lena.kowalski@example.com', at: '3h ago' },
  { id: 5, actor: 'Hiroshi Tanaka', action: 'archived', target: 'project “Northwind”', at: '5h ago' },
  { id: 6, actor: 'Fatima Al-Rashid', action: 'rotated', target: 'production signing key', at: 'Yesterday' },
]

export interface Thread {
  id: number
  from: string
  subject: string
  preview: string
  body: string[]
  at: string
  unread: boolean
  starred: boolean
  label: 'inbox' | 'archived'
  tag?: 'incident' | 'review' | 'billing' | 'hiring'
}

export const threads: Thread[] = [
  {
    id: 1, from: 'Priya Raghunathan', subject: 'INC-2210 postmortem draft',
    preview: 'Draft is ready for review — the timeline section still needs your input on…',
    at: '09:14', unread: true, starred: true, label: 'inbox', tag: 'incident',
    body: [
      'Draft is ready for review. The timeline section still needs your input on when the rate limiter started shedding traffic.',
      'I have the Grafana annotations lined up, but the gap between 02:14 and 02:31 is unaccounted for. Were we already failing over at that point?',
      'Aiming to circulate this to the wider group on Thursday.',
    ],
  },
  {
    id: 2, from: 'Tobias Lindqvist', subject: 'PR #4821 — rate limiter rewrite',
    preview: 'Left a few comments. The token bucket refill looks right but I am unsure about…',
    at: '08:02', unread: true, starred: false, label: 'inbox', tag: 'review',
    body: [
      'Left a few comments. The token bucket refill looks right, but I am unsure about the clock source — monotonic vs wall.',
      'If it is wall time, an NTP step could hand out a burst of free tokens.',
    ],
  },
  {
    id: 3, from: 'Billing', subject: 'Invoice INV-2041 is available',
    preview: 'Your September invoice for $240.00 has been issued and paid automatically.',
    at: 'Yesterday', unread: false, starred: false, label: 'inbox', tag: 'billing',
    body: ['Your September invoice for $240.00 has been issued and paid automatically against the card ending 4242.'],
  },
  {
    id: 4, from: 'Nnamdi Okafor', subject: 'Platform engineer — scheduling',
    preview: 'Candidate is available Tuesday or Thursday afternoon. Which suits you?',
    at: 'Yesterday', unread: false, starred: true, label: 'inbox', tag: 'hiring',
    body: ['Candidate is available Tuesday or Thursday afternoon. Which suits you? I will send the systems-design brief once we lock a slot.'],
  },
  {
    id: 5, from: 'Ingrid Sørensen', subject: 'Storage growth trending up',
    preview: 'We are at 38% but the slope changed after the media pipeline shipped.',
    at: 'Mon', unread: false, starred: false, label: 'inbox',
    body: ['We are at 38% but the slope changed after the media pipeline shipped. At the current rate we hit 80% in about eleven weeks.'],
  },
  {
    id: 6, from: 'Hiroshi Tanaka', subject: 'Archived: Northwind wind-down',
    preview: 'All resources are released. Keeping the bucket for 90 days per policy.',
    at: 'Sep 2', unread: false, starred: false, label: 'archived',
    body: ['All resources are released. Keeping the bucket for 90 days per retention policy, then it drops automatically.'],
  },
]

/* ===============================================================
   Dashboard variants — analytics · sales · ecommerce · banking · project
   Everything below draws on its own seeded stream so the numbers stay
   stable regardless of what else lands in this file, and no value is
   derived from the wall clock (SSR and client must agree exactly).
   =============================================================== */

/** Fixed "today" for every demo dashboard: 2026-09-15, in UTC so the
 *  server's timezone can never shift a label. */

/** `Sep 15` for the day `offset` days before the fixed demo date. */
/** Offset BACKWARD from the demo epoch (0 = today, 3 = three days ago). */
export function dayLabelBack(offset: number) {
  return monthDayLabel(-offset)
}

/** `2026-09-15` for the day `offset` days before the fixed demo date. */
/** Offset BACKWARD from the demo epoch (0 = today, 3 = three days ago). */
export function isoDayBack(offset: number) {
  return isoDay(-offset)
}

/** `Mon` … `Sun` for the day `offset` days before the fixed demo date. */
/** Offset BACKWARD from the demo epoch (0 = today, 3 = three days ago). */
export function weekdayBack(offset: number) {
  return weekdayLabel(-offset)
}

/* ---------------------------------------------------------------
   1 · Analytics — traffic and engagement
---------------------------------------------------------------- */

const analyticsRand = seeded(20260401)

export const ANALYTICS_DAYS = 180

/** Oldest → newest, so a range selector can simply take the tail. */
export const analyticsLabels: string[] = Array.from(
  { length: ANALYTICS_DAYS },
  (_, i) => dayLabelBack(ANALYTICS_DAYS - 1 - i),
)

function analyticsWalk(n: number, start: number, drift: number, vol: number) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(1, v * (1 + drift + (analyticsRand() - 0.5) * vol))
    out.push(Math.round(v))
  }
  return out
}

export const analyticsSessions = analyticsWalk(ANALYTICS_DAYS, 6800, 0.004, 0.16)
/** Users are a share of sessions, never above them. */
export const analyticsUsers = analyticsSessions.map(v => Math.round(v * (0.56 + analyticsRand() * 0.14)))
/** Bounce rate, percent. */
export const analyticsBounce = analyticsSessions.map(() => Math.round((36 + analyticsRand() * 11) * 10) / 10)
/** Average session duration, seconds. */
export const analyticsDuration = analyticsSessions.map(() => Math.round(142 + analyticsRand() * 84))

export interface TopPage {
  path: string
  title: string
  views: number
  uniques: number
  avgSeconds: number
  bounce: number
  delta: number
}

export const analyticsTopPages: TopPage[] = [
  { path: '/', title: 'Home', views: 84210, uniques: 51940, avgSeconds: 96, bounce: 41.2, delta: 0.064 },
  { path: '/pricing', title: 'Pricing', views: 39480, uniques: 30120, avgSeconds: 174, bounce: 28.5, delta: 0.131 },
  { path: '/docs/quickstart', title: 'Quickstart', views: 27640, uniques: 18830, avgSeconds: 312, bounce: 22.1, delta: 0.087 },
  { path: '/changelog', title: 'Changelog', views: 19205, uniques: 12470, avgSeconds: 141, bounce: 35.8, delta: -0.042 },
  { path: '/blog/rate-limits', title: 'Designing rate limits', views: 16890, uniques: 14210, avgSeconds: 268, bounce: 47.3, delta: 0.219 },
  { path: '/integrations', title: 'Integrations', views: 12340, uniques: 9105, avgSeconds: 122, bounce: 39.6, delta: -0.018 },
  { path: '/signup', title: 'Create account', views: 10870, uniques: 9940, avgSeconds: 88, bounce: 18.4, delta: 0.052 },
  { path: '/status', title: 'System status', views: 7410, uniques: 5320, avgSeconds: 54, bounce: 62.7, delta: -0.126 },
]

export interface AcquisitionRow { name: string, sessions: number, delta: number }

/** Fixed order — these rows keep their chart slot across every view. */
export const analyticsAcquisition: AcquisitionRow[] = [
  { name: 'Organic search', sessions: 214800, delta: 0.081 },
  { name: 'Direct', sessions: 138400, delta: 0.027 },
  { name: 'Paid search', sessions: 96250, delta: -0.049 },
  { name: 'Referral', sessions: 61070, delta: 0.114 },
  { name: 'Social', sessions: 44620, delta: 0.168 },
  { name: 'Email', sessions: 28940, delta: -0.011 },
]

export const analyticsDevices = [
  { name: 'Desktop', value: 312400 },
  { name: 'Mobile', value: 238600 },
  { name: 'Tablet', value: 33080 },
]

/** Pages per session — one measure, so it never shares an axis with sessions. */
export const analyticsDevicePages = [
  { label: 'Desktop', value: 4.8, icon: 'lucide:monitor' },
  { label: 'Mobile', value: 2.9, icon: 'lucide:smartphone' },
  { label: 'Tablet', value: 3.6, icon: 'lucide:tablet' },
]

/* ---------------------------------------------------------------
   2 · Sales — revenue pipeline
---------------------------------------------------------------- */

const salesRand = seeded(20260212)

export interface PipelineStage { name: string, deals: number, value: number }

export const salesPipeline: PipelineStage[] = [
  { name: 'Qualified', deals: 186, value: 4_240_000 },
  { name: 'Discovery', deals: 128, value: 3_110_000 },
  { name: 'Proposal', deals: 79, value: 2_240_000 },
  { name: 'Negotiation', deals: 43, value: 1_385_000 },
  { name: 'Closed won', deals: 24, value: 762_000 },
]

/** Both series are booked dollars, so they share one scale honestly. */
export const salesTarget = [620, 620, 660, 660, 700, 700, 740, 740, 780, 780, 820, 820]
  .map(v => v * 1000)
export const salesBooked = salesTarget.map(t => Math.round((t * (0.80 + salesRand() * 0.42)) / 1000) * 1000)

export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed won' | 'Stalled'

export interface Deal {
  id: string
  account: string
  owner: string
  stage: DealStage
  value: number
  probability: number
  closes: string
}

export const salesDeals: Deal[] = [
  { id: 'D-4821', account: 'Northwind Logistics', owner: 'Amara Osei', stage: 'Negotiation', value: 284000, probability: 0.78, closes: 'Sep 26' },
  { id: 'D-4815', account: 'Halden Foods', owner: 'Diego Moreno', stage: 'Proposal', value: 162500, probability: 0.55, closes: 'Oct 03' },
  { id: 'D-4809', account: 'Keystone Health', owner: 'Priya Raghunathan', stage: 'Closed won', value: 341000, probability: 1, closes: 'Sep 12' },
  { id: 'D-4802', account: 'Vantage Robotics', owner: 'Tobias Lindqvist', stage: 'Discovery', value: 98000, probability: 0.25, closes: 'Nov 14' },
  { id: 'D-4796', account: 'Meridian Bank', owner: 'Amara Osei', stage: 'Negotiation', value: 512000, probability: 0.68, closes: 'Oct 09' },
  { id: 'D-4791', account: 'Cobalt Studios', owner: 'Lena Kowalski', stage: 'Stalled', value: 74500, probability: 0.12, closes: 'Dec 01' },
  { id: 'D-4788', account: 'Ardent Energy', owner: 'Diego Moreno', stage: 'Proposal', value: 228000, probability: 0.48, closes: 'Oct 21' },
  { id: 'D-4783', account: 'Pellworm Mobility', owner: 'Priya Raghunathan', stage: 'Closed won', value: 186000, probability: 1, closes: 'Sep 08' },
  { id: 'D-4777', account: 'Solace Retail', owner: 'Lena Kowalski', stage: 'Discovery', value: 61000, probability: 0.2, closes: 'Nov 28' },
  { id: 'D-4770', account: 'Tessellate AI', owner: 'Tobias Lindqvist', stage: 'Negotiation', value: 149000, probability: 0.72, closes: 'Sep 30' },
]

export interface SalesRep {
  name: string
  region: string
  closed: number
  quota: number
  deals: number
}

export const salesReps: SalesRep[] = [
  { name: 'Amara Osei', region: 'EMEA', closed: 1_284_000, quota: 1_200_000, deals: 14 },
  { name: 'Priya Raghunathan', region: 'APAC', closed: 1_042_000, quota: 1_100_000, deals: 11 },
  { name: 'Diego Moreno', region: 'AMER', closed: 918_000, quota: 1_000_000, deals: 16 },
  { name: 'Tobias Lindqvist', region: 'EMEA', closed: 736_000, quota: 900_000, deals: 9 },
  { name: 'Lena Kowalski', region: 'AMER', closed: 512_000, quota: 800_000, deals: 7 },
]

export interface RecentClose {
  id: string
  account: string
  owner: string
  value: number
  plan: string
  at: string
}

export const salesRecentCloses: RecentClose[] = [
  { id: 'D-4809', account: 'Keystone Health', owner: 'Priya Raghunathan', value: 341000, plan: 'Enterprise · 3 yr', at: '2h ago' },
  { id: 'D-4783', account: 'Pellworm Mobility', owner: 'Priya Raghunathan', value: 186000, plan: 'Scale · 2 yr', at: 'Yesterday' },
  { id: 'D-4761', account: 'Brightline Media', owner: 'Amara Osei', value: 92500, plan: 'Scale · 1 yr', at: 'Sep 11' },
  { id: 'D-4758', account: 'Orbit Freight', owner: 'Diego Moreno', value: 47000, plan: 'Team · 1 yr', at: 'Sep 10' },
  { id: 'D-4744', account: 'Fenwick Labs', owner: 'Tobias Lindqvist', value: 128000, plan: 'Enterprise · 2 yr', at: 'Sep 08' },
]

/* ---------------------------------------------------------------
   3 · Ecommerce — storefront
---------------------------------------------------------------- */

const shopRand = seeded(20260707)

export const SHOP_DAYS = 30
export const shopDayLabels: string[] = Array.from(
  { length: SHOP_DAYS },
  (_, i) => dayLabelBack(SHOP_DAYS - 1 - i),
)

function shopWalk(n: number, start: number, drift: number, vol: number) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(1, v * (1 + drift + (shopRand() - 0.5) * vol))
    out.push(Math.round(v))
  }
  return out
}

export const shopOrdersDaily = shopWalk(SHOP_DAYS, 940, 0.005, 0.18)
export const shopRevenueDaily = shopOrdersDaily.map(o => Math.round(o * (78 + shopRand() * 26)))
export const shopRefundsDaily = shopOrdersDaily.map(o => Math.round(o * (0.012 + shopRand() * 0.016)))
export const shopConversionDaily = shopOrdersDaily.map(() => Math.round((2.1 + shopRand() * 1.4) * 100) / 100)

export type OrderStatus = 'paid' | 'packing' | 'shipped' | 'delivered' | 'refunded' | 'failed'

export interface ShopOrder {
  id: string
  customer: string
  items: number
  total: number
  status: OrderStatus
  channel: 'Web' | 'iOS' | 'Android' | 'Marketplace'
  placed: string
}

export const shopOrders: ShopOrder[] = [
  { id: '#30241', customer: 'Siobhan Carroll', items: 3, total: 214.5, status: 'paid', channel: 'Web', placed: '6m ago' },
  { id: '#30240', customer: 'Yusuf Adeyemi', items: 1, total: 89, status: 'packing', channel: 'iOS', placed: '24m ago' },
  { id: '#30239', customer: 'Elif Demir', items: 5, total: 412.75, status: 'shipped', channel: 'Web', placed: '1h ago' },
  { id: '#30238', customer: 'Rafael Costa', items: 2, total: 156, status: 'failed', channel: 'Android', placed: '2h ago' },
  { id: '#30237', customer: 'Ingrid Sørensen', items: 4, total: 298.2, status: 'delivered', channel: 'Marketplace', placed: '3h ago' },
  { id: '#30236', customer: 'Nnamdi Okafor', items: 1, total: 64.9, status: 'refunded', channel: 'Web', placed: '5h ago' },
  { id: '#30235', customer: 'Clara Beaumont', items: 7, total: 731.4, status: 'shipped', channel: 'Web', placed: '6h ago' },
  { id: '#30234', customer: 'Rustam Iskandarov', items: 2, total: 178.3, status: 'delivered', channel: 'iOS', placed: '8h ago' },
  { id: '#30233', customer: 'Fatima Al-Rashid', items: 3, total: 245, status: 'paid', channel: 'Web', placed: 'Yesterday' },
  { id: '#30232', customer: 'Marcus Webb', items: 1, total: 52.5, status: 'packing', channel: 'Android', placed: 'Yesterday' },
]

export interface ShopProduct {
  id: string
  name: string
  sku: string
  category: string
  sold: number
  revenue: number
  stock: number
  reorderAt: number
}

export const shopProducts: ShopProduct[] = [
  { id: 'p1', name: 'Harbour Wool Throw', sku: 'HWT-204', category: 'Home', sold: 1840, revenue: 147200, stock: 312, reorderAt: 150 },
  { id: 'p2', name: 'Meridian Desk Lamp', sku: 'MDL-118', category: 'Lighting', sold: 1425, revenue: 128250, stock: 48, reorderAt: 120 },
  { id: 'p3', name: 'Coastline Ceramic Set', sku: 'CCS-071', category: 'Kitchen', sold: 1198, revenue: 95840, stock: 26, reorderAt: 90 },
  { id: 'p4', name: 'Tidewater Canvas Tote', sku: 'TCT-330', category: 'Bags', sold: 1064, revenue: 63840, stock: 540, reorderAt: 200 },
  { id: 'p5', name: 'Ember Cast Skillet', sku: 'ECS-012', category: 'Kitchen', sold: 902, revenue: 81180, stock: 71, reorderAt: 80 },
  { id: 'p6', name: 'Slate Linen Cushion', sku: 'SLC-155', category: 'Home', sold: 874, revenue: 43700, stock: 12, reorderAt: 100 },
  { id: 'p7', name: 'Northlight Wall Clock', sku: 'NWC-088', category: 'Lighting', sold: 640, revenue: 44800, stock: 205, reorderAt: 90 },
]

export const shopCategoryRevenue = [
  { name: 'Home', value: 190900 },
  { name: 'Kitchen', value: 177020 },
  { name: 'Lighting', value: 173050 },
  { name: 'Bags', value: 63840 },
  { name: 'Outdoor', value: 41260 },
]

/* ---------------------------------------------------------------
   4 · Banking — accounts
---------------------------------------------------------------- */

const bankRand = seeded(20260318)

export const BANK_DAYS = 60
export const bankBalanceLabels: string[] = Array.from(
  { length: BANK_DAYS },
  (_, i) => dayLabelBack(BANK_DAYS - 1 - i),
)

export const bankBalanceHistory: number[] = (() => {
  const out: number[] = []
  let v = 126_400
  for (let i = 0; i < BANK_DAYS; i++) {
    v = Math.max(1000, v * (1 + 0.002 + (bankRand() - 0.5) * 0.035))
    out.push(Math.round(v))
  }
  return out
})()

export interface BankAccount {
  id: string
  name: string
  kind: 'Checking' | 'Savings' | 'Credit' | 'Investment'
  mask: string
  balance: number
  /** Signed month-over-month change, as a fraction. */
  delta: number
  trend: number[]
}

function bankTrend(start: number, drift: number) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < 24; i++) {
    v = Math.max(1, v * (1 + drift + (bankRand() - 0.5) * 0.05))
    out.push(Math.round(v))
  }
  return out
}

export const bankAccounts: BankAccount[] = [
  { id: 'a1', name: 'Operating', kind: 'Checking', mask: '•••• 4417', balance: 68420.18, delta: 0.042, trend: bankTrend(62000, 0.004) },
  { id: 'a2', name: 'Reserve', kind: 'Savings', mask: '•••• 9072', balance: 142880.00, delta: 0.011, trend: bankTrend(138000, 0.001) },
  { id: 'a3', name: 'Corporate card', kind: 'Credit', mask: '•••• 2260', balance: -8214.63, delta: 0.187, trend: bankTrend(6100, 0.012) },
  { id: 'a4', name: 'Treasury ladder', kind: 'Investment', mask: '•••• 5531', balance: 310_500.00, delta: -0.008, trend: bankTrend(316000, -0.0005) },
]

export interface BankTransaction {
  id: string
  date: string
  merchant: string
  category: string
  method: string
  /** Negative is money out, positive is money in. */
  amount: number
}

export const bankTransactions: BankTransaction[] = [
  { id: 't1', date: isoDayBack(0), merchant: 'Keystone Health', category: 'Customer payment', method: 'ACH', amount: 34100 },
  { id: 't2', date: isoDayBack(0), merchant: 'Northbound Cloud', category: 'Infrastructure', method: 'Card •••• 2260', amount: -4280.55 },
  { id: 't3', date: isoDayBack(0), merchant: 'Kestrel Coffee', category: 'Office', method: 'Card •••• 2260', amount: -68.4 },
  { id: 't4', date: isoDayBack(1), merchant: 'Pellworm Mobility', category: 'Customer payment', method: 'Wire', amount: 18600 },
  { id: 't5', date: isoDayBack(1), merchant: 'Harrow & Finch', category: 'Legal', method: 'ACH', amount: -7250 },
  { id: 't6', date: isoDayBack(1), merchant: 'Vale Payroll', category: 'Payroll', method: 'ACH', amount: -41820.9 },
  { id: 't7', date: isoDayBack(1), merchant: 'Atlas Travel', category: 'Travel', method: 'Card •••• 2260', amount: -1962.3 },
  { id: 't8', date: isoDayBack(2), merchant: 'Brightline Media', category: 'Customer payment', method: 'ACH', amount: 9250 },
  { id: 't9', date: isoDayBack(2), merchant: 'Signal Analytics', category: 'Software', method: 'Card •••• 2260', amount: -899 },
  { id: 't10', date: isoDayBack(2), merchant: 'Quay Street Lease', category: 'Facilities', method: 'ACH', amount: -12400 },
  { id: 't11', date: isoDayBack(3), merchant: 'Orbit Freight', category: 'Customer payment', method: 'ACH', amount: 4700 },
  { id: 't12', date: isoDayBack(3), merchant: 'Ferrous Supply', category: 'Equipment', method: 'Card •••• 2260', amount: -3145.75 },
  { id: 't13', date: isoDayBack(3), merchant: 'Meridian Bank', category: 'Interest', method: 'Transfer', amount: 412.88 },
  { id: 't14', date: isoDayBack(4), merchant: 'Fenwick Labs', category: 'Customer payment', method: 'Wire', amount: 12800 },
  { id: 't15', date: isoDayBack(4), merchant: 'Ardent Energy', category: 'Utilities', method: 'ACH', amount: -2210.4 },
  { id: 't16', date: isoDayBack(4), merchant: 'Kestrel Coffee', category: 'Office', method: 'Card •••• 2260', amount: -54.2 },
  { id: 't17', date: isoDayBack(4), merchant: 'Northbound Cloud', category: 'Infrastructure', method: 'Card •••• 2260', amount: -1180 },
]

export const bankSpendCategories = [
  { name: 'Payroll', value: 41820 },
  { name: 'Infrastructure', value: 18640 },
  { name: 'Facilities', value: 12400 },
  { name: 'Legal', value: 7250 },
  { name: 'Travel', value: 4930 },
  { name: 'Equipment', value: 3145 },
  { name: 'Office', value: 1290 },
]

export interface UpcomingPayment {
  id: string
  name: string
  detail: string
  amount: number
  dueLabel: string
  daysAway: number
  autopay: boolean
}

export const bankUpcoming: UpcomingPayment[] = [
  { id: 'u1', name: 'Vale Payroll', detail: 'Semi-monthly run', amount: 41820.9, dueLabel: 'Tomorrow', daysAway: 1, autopay: true },
  { id: 'u2', name: 'Quay Street Lease', detail: 'Office, floors 3–4', amount: 12400, dueLabel: 'in 4 days', daysAway: 4, autopay: true },
  { id: 'u3', name: 'Corporate card', detail: 'Statement •••• 2260', amount: 8214.63, dueLabel: 'in 6 days', daysAway: 6, autopay: false },
  { id: 'u4', name: 'Northbound Cloud', detail: 'Committed spend', amount: 5400, dueLabel: 'in 11 days', daysAway: 11, autopay: true },
  { id: 'u5', name: 'Harrow & Finch', detail: 'Retainer', amount: 7250, dueLabel: 'in 16 days', daysAway: 16, autopay: false },
]

/* ---------------------------------------------------------------
   5 · Project — delivery
---------------------------------------------------------------- */

export interface BoardColumn {
  name: string
  count: number
  icon: string
  /** Work items added to this column in the last seven days. */
  added: number
}

export const projectBoard: BoardColumn[] = [
  { name: 'Backlog', count: 62, icon: 'lucide:inbox', added: 11 },
  { name: 'Ready', count: 18, icon: 'lucide:list-checks', added: 6 },
  { name: 'In progress', count: 14, icon: 'lucide:hammer', added: 9 },
  { name: 'In review', count: 7, icon: 'lucide:eye', added: 5 },
  { name: 'Done', count: 41, icon: 'lucide:circle-check', added: 17 },
]

export const SPRINT_DAYS = 12
export const projectSprintLabels: string[] = Array.from(
  { length: SPRINT_DAYS },
  (_, i) => `Day ${i + 1}`,
)

/** Story points left. Ideal is the straight line; actual is what happened. */
export const projectBurndownIdeal: number[] = Array.from(
  { length: SPRINT_DAYS },
  (_, i) => Math.round(96 - (96 / (SPRINT_DAYS - 1)) * i),
)
export const projectBurndownActual = [96, 94, 88, 85, 79, 76, 62, 58, 51, 44, 31, 22]

export interface WorkloadRow {
  name: string
  role: string
  assigned: number
  capacity: number
}

export const projectWorkload: WorkloadRow[] = [
  { name: 'Amara Osei', role: 'Tech lead', assigned: 34, capacity: 32 },
  { name: 'Tobias Lindqvist', role: 'Backend', assigned: 28, capacity: 32 },
  { name: 'Priya Raghunathan', role: 'Frontend', assigned: 31, capacity: 32 },
  { name: 'Lena Kowalski', role: 'Design', assigned: 18, capacity: 24 },
  { name: 'Hiroshi Tanaka', role: 'QA', assigned: 26, capacity: 24 },
  { name: 'Diego Moreno', role: 'Data', assigned: 12, capacity: 32 },
]

export interface Milestone {
  name: string
  detail: string
  date: string
  status: 'shipped' | 'active' | 'upcoming' | 'slipping'
  progress: number
}

export const projectMilestones: Milestone[] = [
  { name: 'Schema freeze', detail: 'Migrations locked for v3', date: 'Aug 04', status: 'shipped', progress: 100 },
  { name: 'Ingest rewrite', detail: 'Streaming pipeline cutover', date: 'Aug 28', status: 'shipped', progress: 100 },
  { name: 'Beta to design partners', detail: '12 accounts, gated flag', date: 'Sep 19', status: 'active', progress: 68 },
  { name: 'Load test at 5×', detail: 'Blocked on staging capacity', date: 'Sep 30', status: 'slipping', progress: 24 },
  { name: 'General availability', detail: 'Docs, pricing, launch post', date: 'Oct 24', status: 'upcoming', progress: 0 },
]

export interface RiskItem {
  id: string
  title: string
  owner: string
  impact: 'high' | 'medium' | 'low'
  note: string
  due: string
}

export const projectRisks: RiskItem[] = [
  { id: 'R-01', title: 'Staging cannot reach 5× load', owner: 'Hiroshi Tanaka', impact: 'high', note: 'Capacity request open with infra since Sep 04.', due: 'Sep 30' },
  { id: 'R-02', title: 'Design partner NDAs unsigned', owner: 'Lena Kowalski', impact: 'medium', note: '3 of 12 accounts outstanding.', due: 'Sep 19' },
  { id: 'R-03', title: 'Backfill job exceeds window', owner: 'Diego Moreno', impact: 'medium', note: 'Runs 9h against a 6h maintenance window.', due: 'Oct 02' },
  { id: 'R-04', title: 'Launch copy not started', owner: 'Amara Osei', impact: 'low', note: 'Waiting on final pricing tiers.', due: 'Oct 17' },
]

export const projectActivity: Activity[] = [
  { id: 1, actor: 'Priya Raghunathan', action: 'moved', target: 'GORG-812 to In review', at: '12m ago' },
  { id: 2, actor: 'Tobias Lindqvist', action: 'closed', target: 'GORG-799 — retry budget', at: '48m ago' },
  { id: 3, actor: 'Hiroshi Tanaka', action: 'flagged', target: 'load test as at risk', at: '2h ago' },
  { id: 4, actor: 'Lena Kowalski', action: 'attached', target: 'onboarding flow v4', at: '4h ago' },
  { id: 5, actor: 'Amara Osei', action: 'reassigned', target: 'GORG-804 to Diego', at: 'Yesterday' },
  { id: 6, actor: 'Diego Moreno', action: 'started', target: 'GORG-817 — backfill', at: 'Yesterday' },
]
