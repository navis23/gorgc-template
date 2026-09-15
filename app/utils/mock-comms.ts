/**
 * Sample data for the communications desk — the messaging workspace, the
 * applicant tracker and the editorial calendar.
 *
 * Three rules hold this file together:
 *
 * 1. Nothing reads the wall clock. Every instant comes from the fixed demo
 *    epoch through `~/utils/datetime`, so the server and the browser build the
 *    same strings and Vue never reports a hydration mismatch.
 * 2. Every pseudo-random series is drawn from its OWN seeded generator, local
 *    to this file. The shared `walk()` in `mock.ts` draws from one mutable
 *    stream, so consuming it during render puts SSR and the client at different
 *    stream positions and they render different numbers.
 * 3. Counts that a page can also derive (applicants per role, applicants per
 *    stage, top articles) are NOT stored twice. They are computed from the one
 *    list that owns them, so a drill-down filter can never disagree with the
 *    headline next to it.
 */
import { demoDate } from '~/utils/datetime'

/* -------------------------------------------------------------------------
   Deterministic generators — module-private
   ---------------------------------------------------------------------- */

/** xorshift32 — integer ops only, so every runtime produces the same stream. */
function stream(seed: number): () => number {
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

function roundTo(n: number, decimals = 0): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

/** Random walk with drift, rounded at the source so every reader agrees. */
function drift(seed: number, n: number, start: number, slope: number, vol: number, decimals = 0): number[] {
  const next = stream(seed)
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(start * 0.2, v * (1 + slope + (next() - 0.5) * vol))
    out.push(roundTo(v, decimals))
  }
  return out
}

/**
 * A noisy line from `start` to `end` with BOTH endpoints pinned.
 *
 * Tile sparklines are coloured by direction (last value vs first), so a
 * free-running walk can drift downwards under a `+9%` delta and put the line at
 * odds with the number printed beside it. Pinning the ends makes the two agree
 * by construction.
 */
function ramp(seed: number, n: number, start: number, end: number, vol = 0.06, decimals = 0): number[] {
  const next = stream(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 1
    const base = start + (end - start) * t
    const noise = i === 0 || i === n - 1 ? 0 : (next() - 0.5) * base * vol * 2
    out.push(roundTo(Math.max(0, base + noise), decimals))
  }
  return out
}

/* =========================================================================
   1 · Messaging — the shared team/customer inbox
   ====================================================================== */

export type MsgPresence = 'online' | 'away' | 'busy' | 'offline'
export type MsgChannel = 'Chat' | 'Email' | 'Support' | 'Voice'
export type MsgState = 'open' | 'assigned' | 'resolved'

export interface MsgPerson {
  id: string
  name: string
  role: string
  company: string
  email: string
  /** Fixed offset label, never computed from the host clock. */
  zone: string
  localTime: string
  presence: MsgPresence
}

export interface MsgFile {
  id: string
  name: string
  kind: 'pdf' | 'image' | 'sheet' | 'archive' | 'doc'
  size: string
  /** Day offset from the demo epoch; negative is the past. */
  sharedDay: number
  by: string
}

export interface MsgBubble {
  id: string
  /** Display name of the author; `outgoing` decides the side. */
  author: string
  body: string
  at: Date
  outgoing: boolean
  state?: 'sent' | 'delivered' | 'read'
  attachment?: { name: string, size: string }
  /** A short internal note is styled apart from a customer-visible reply. */
  internal?: boolean
}

export interface MsgConversation {
  id: string
  person: MsgPerson
  channel: MsgChannel
  subject: string
  preview: string
  unread: number
  at: Date
  state: MsgState
  assignee: string
  labels: string[]
  /** Minutes to the first human reply on this conversation. */
  firstReplyMins: number
  /** Other people on the thread besides the counterpart and the operator. */
  watchers: Array<{ name: string, role: string }>
  files: MsgFile[]
}

const msgPeople: Record<string, MsgPerson> = {
  nadia: {
    id: 'nadia',
    name: 'Nadia Farouk',
    role: 'Head of Operations',
    company: 'Halvard Freight',
    email: 'nadia@halvardfreight.com',
    zone: 'UTC+02:00 · Cairo',
    localTime: '11:42',
    presence: 'online',
  },
  bjorn: {
    id: 'bjorn',
    name: 'Bjorn Aaltonen',
    role: 'Platform Engineer',
    company: 'Internal · Platform',
    email: 'bjorn@gorg.example',
    zone: 'UTC+03:00 · Helsinki',
    localTime: '12:42',
    presence: 'busy',
  },
  imani: {
    id: 'imani',
    name: 'Imani Sesay',
    role: 'Finance Lead',
    company: 'Northlane Studios',
    email: 'imani@northlane.example',
    zone: 'UTC+00:00 · Accra',
    localTime: '09:42',
    presence: 'away',
  },
  takeshi: {
    id: 'takeshi',
    name: 'Takeshi Arai',
    role: 'Integrations Partner',
    company: 'Kura Systems',
    email: 't.arai@kurasystems.example',
    zone: 'UTC+09:00 · Osaka',
    localTime: '18:42',
    presence: 'offline',
  },
  colette: {
    id: 'colette',
    name: 'Colette Reyes',
    role: 'Procurement Manager',
    company: 'Verdant Grocers',
    email: 'colette.reyes@verdant.example',
    zone: 'UTC−05:00 · Bogotá',
    localTime: '04:42',
    presence: 'offline',
  },
  wren: {
    id: 'wren',
    name: 'Wren Adeyemi',
    role: 'Support Specialist',
    company: 'Internal · Support',
    email: 'wren@gorg.example',
    zone: 'UTC+01:00 · Lagos',
    localTime: '10:42',
    presence: 'online',
  },
  soraya: {
    id: 'soraya',
    name: 'Soraya Bakker',
    role: 'IT Director',
    company: 'Meridian Health',
    email: 's.bakker@meridianhealth.example',
    zone: 'UTC+01:00 · Utrecht',
    localTime: '10:42',
    presence: 'online',
  },
}

export const msgConversations: MsgConversation[] = [
  {
    id: 'c-2041',
    person: msgPeople.nadia!,
    channel: 'Support',
    subject: 'Bulk import stalls at 8,000 rows',
    preview: 'The retry finished overnight — 11,420 of 11,420. Thank you for staying on it.',
    unread: 2,
    at: demoDate(0, 9, 12),
    state: 'open',
    assignee: 'Wren Adeyemi',
    labels: ['Escalated', 'Enterprise', 'Imports'],
    firstReplyMins: 7,
    watchers: [
      { name: 'Bjorn Aaltonen', role: 'Platform Engineer' },
      { name: 'Priya Venkatesan', role: 'Support Manager' },
    ],
    files: [
      { id: 'f-1', name: 'import-run-8841.log', kind: 'archive', size: '2.4 MB', sharedDay: -1, by: 'Nadia Farouk' },
      { id: 'f-2', name: 'halvard-catalogue.csv', kind: 'sheet', size: '18.9 MB', sharedDay: -2, by: 'Nadia Farouk' },
      { id: 'f-3', name: 'retry-timeline.png', kind: 'image', size: '318 KB', sharedDay: 0, by: 'Wren Adeyemi' },
    ],
  },
  {
    id: 'c-2039',
    person: msgPeople.soraya!,
    channel: 'Email',
    subject: 'SSO rollout — SCIM provisioning questions',
    preview: 'Can we map the nursing rota group to a role instead of a seat licence?',
    unread: 1,
    at: demoDate(0, 8, 26),
    state: 'assigned',
    assignee: 'Wren Adeyemi',
    labels: ['Security', 'Onboarding'],
    firstReplyMins: 24,
    watchers: [{ name: 'Rafiq Haddad', role: 'Solutions Architect' }],
    files: [
      { id: 'f-4', name: 'meridian-scim-mapping.pdf', kind: 'pdf', size: '740 KB', sharedDay: -1, by: 'Soraya Bakker' },
      { id: 'f-5', name: 'idp-metadata.xml', kind: 'doc', size: '12 KB', sharedDay: -3, by: 'Soraya Bakker' },
    ],
  },
  {
    id: 'c-2036',
    person: msgPeople.bjorn!,
    channel: 'Chat',
    subject: 'Queue backlog on eu-west writer',
    preview: 'Backlog is down to 400. I will keep the extra consumer until Thursday.',
    unread: 0,
    at: demoDate(0, 7, 55),
    state: 'assigned',
    assignee: 'Wren Adeyemi',
    labels: ['Infrastructure'],
    firstReplyMins: 3,
    watchers: [{ name: 'Priya Venkatesan', role: 'Support Manager' }],
    files: [
      { id: 'f-6', name: 'consumer-lag.png', kind: 'image', size: '204 KB', sharedDay: 0, by: 'Bjorn Aaltonen' },
    ],
  },
  {
    id: 'c-2031',
    person: msgPeople.imani!,
    channel: 'Email',
    subject: 'Invoice 4471 — proration on the March upgrade',
    preview: 'Attaching the credit note. Let me know if the finance portal still shows the old figure.',
    unread: 3,
    at: demoDate(-1, 16, 40),
    state: 'open',
    assignee: 'Unassigned',
    labels: ['Billing'],
    firstReplyMins: 52,
    watchers: [{ name: 'Marisol Duarte', role: 'Revenue Operations' }],
    files: [
      { id: 'f-7', name: 'credit-note-4471.pdf', kind: 'pdf', size: '96 KB', sharedDay: -1, by: 'Wren Adeyemi' },
      { id: 'f-8', name: 'invoice-4471.pdf', kind: 'pdf', size: '88 KB', sharedDay: -4, by: 'Imani Sesay' },
    ],
  },
  {
    id: 'c-2028',
    person: msgPeople.takeshi!,
    channel: 'Chat',
    subject: 'Webhook signature rotation window',
    preview: 'We can cut over on the 22nd if you publish the second key a week early.',
    unread: 0,
    at: demoDate(-1, 11, 5),
    state: 'assigned',
    assignee: 'Rafiq Haddad',
    labels: ['Integrations', 'Partner'],
    firstReplyMins: 18,
    watchers: [{ name: 'Bjorn Aaltonen', role: 'Platform Engineer' }],
    files: [
      { id: 'f-9', name: 'rotation-plan.pdf', kind: 'pdf', size: '412 KB', sharedDay: -2, by: 'Takeshi Arai' },
    ],
  },
  {
    id: 'c-2024',
    person: msgPeople.colette!,
    channel: 'Voice',
    subject: 'Callback — purchase order approvals',
    preview: 'Summary of the call is in the thread. Two approvers to add before Friday.',
    unread: 0,
    at: demoDate(-2, 15, 30),
    state: 'resolved',
    assignee: 'Wren Adeyemi',
    labels: ['Accounts'],
    firstReplyMins: 11,
    watchers: [],
    files: [
      { id: 'f-10', name: 'call-notes-verdant.doc', kind: 'doc', size: '28 KB', sharedDay: -2, by: 'Wren Adeyemi' },
    ],
  },
  {
    id: 'c-2019',
    person: msgPeople.wren!,
    channel: 'Chat',
    subject: 'Weekend handover — open escalations',
    preview: 'Three open, one waiting on the customer. Notes in the shared doc.',
    unread: 0,
    at: demoDate(-3, 17, 48),
    state: 'resolved',
    assignee: 'Priya Venkatesan',
    labels: ['Internal'],
    firstReplyMins: 4,
    watchers: [{ name: 'Priya Venkatesan', role: 'Support Manager' }],
    files: [
      { id: 'f-11', name: 'handover-week-37.doc', kind: 'doc', size: '44 KB', sharedDay: -3, by: 'Wren Adeyemi' },
    ],
  },
]

/**
 * Thread bodies, keyed by conversation. Authored by hand rather than generated
 * — the day separators only mean something if the conversation actually spans
 * days, and a generator would not give that shape.
 */
export const msgThreads: Record<string, MsgBubble[]> = {
  'c-2041': [
    {
      id: 'm-1',
      author: 'Nadia Farouk',
      body: 'Our nightly catalogue import stops at roughly 8,000 rows and then sits there. No error in the UI, the run just never completes.',
      at: demoDate(-2, 8, 4),
      outgoing: false,
    },
    {
      id: 'm-2',
      author: 'Wren Adeyemi',
      body: 'Thanks Nadia — I can see run 8841 holding at 8,012. Could you send the log the exporter writes? I want to confirm where it stops rather than where it reports.',
      at: demoDate(-2, 8, 11),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-3',
      author: 'Nadia Farouk',
      body: 'Attached. The last line is a timeout against the pricing lookup.',
      at: demoDate(-1, 9, 26),
      outgoing: false,
      attachment: { name: 'import-run-8841.log', size: '2.4 MB' },
    },
    {
      id: 'm-4',
      author: 'Bjorn Aaltonen',
      body: 'Pricing lookup was batching 500 rows per call and the upstream cut us off at 30s. I have dropped the batch to 100 and added a retry with backoff.',
      at: demoDate(-1, 10, 2),
      outgoing: true,
      state: 'read',
      internal: true,
    },
    {
      id: 'm-5',
      author: 'Wren Adeyemi',
      body: 'Fix is live in eu-west. I have queued a retry of 8841 for tonight — it will pick up from row 8,012 rather than starting again.',
      at: demoDate(-1, 10, 18),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-6',
      author: 'Nadia Farouk',
      body: 'The retry finished overnight — 11,420 of 11,420. Thank you for staying on it.',
      at: demoDate(0, 9, 8),
      outgoing: false,
    },
    {
      id: 'm-7',
      author: 'Nadia Farouk',
      body: 'One follow-up: can we get an alert when a run exceeds its usual duration, rather than finding out in the morning?',
      at: demoDate(0, 9, 12),
      outgoing: false,
    },
  ],
  'c-2039': [
    {
      id: 'm-11',
      author: 'Soraya Bakker',
      body: 'We are ready to turn on SCIM next week. Before we do — the nursing rota group is about 400 people who each need read access for one shift a month.',
      at: demoDate(-3, 13, 20),
      outgoing: false,
    },
    {
      id: 'm-12',
      author: 'Wren Adeyemi',
      body: 'Understood. Provisioning them as full seats would be wasteful. Let me confirm how group-to-role mapping behaves on your plan.',
      at: demoDate(-3, 13, 44),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-13',
      author: 'Rafiq Haddad',
      body: 'Group mapping lands on a role, not a licence — so a rota group maps to Viewer and consumes no seat until someone signs in. I have written it up against your IdP metadata.',
      at: demoDate(-1, 11, 10),
      outgoing: true,
      state: 'read',
      attachment: { name: 'meridian-scim-mapping.pdf', size: '740 KB' },
    },
    {
      id: 'm-14',
      author: 'Soraya Bakker',
      body: 'Can we map the nursing rota group to a role instead of a seat licence?',
      at: demoDate(0, 8, 26),
      outgoing: false,
    },
  ],
  'c-2036': [
    {
      id: 'm-21',
      author: 'Bjorn Aaltonen',
      body: 'Heads up: the eu-west writer queue is 14k behind. Nothing is failing, it is just slower than it drains.',
      at: demoDate(0, 7, 12),
      outgoing: false,
    },
    {
      id: 'm-22',
      author: 'Wren Adeyemi',
      body: 'Is that the import retry from last night, or something new?',
      at: demoDate(0, 7, 15),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-23',
      author: 'Bjorn Aaltonen',
      body: 'The retry. I have added a second consumer for the morning; it is draining at about 900/min now.',
      at: demoDate(0, 7, 31),
      outgoing: false,
      attachment: { name: 'consumer-lag.png', size: '204 KB' },
    },
    {
      id: 'm-24',
      author: 'Bjorn Aaltonen',
      body: 'Backlog is down to 400. I will keep the extra consumer until Thursday.',
      at: demoDate(0, 7, 55),
      outgoing: false,
    },
  ],
  'c-2031': [
    {
      id: 'm-31',
      author: 'Imani Sesay',
      body: 'Invoice 4471 charges a full quarter for the upgrade we made in the second week of March. I expected it to be prorated.',
      at: demoDate(-4, 14, 2),
      outgoing: false,
      attachment: { name: 'invoice-4471.pdf', size: '88 KB' },
    },
    {
      id: 'm-32',
      author: 'Wren Adeyemi',
      body: 'You are right — the upgrade was applied on the 12th but billed from the 1st. I have asked revenue operations to reissue.',
      at: demoDate(-4, 14, 54),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-33',
      author: 'Marisol Duarte',
      body: 'Credit note raised for the 11 days, and the next invoice will carry the corrected start date.',
      at: demoDate(-1, 16, 22),
      outgoing: true,
      state: 'delivered',
      internal: true,
    },
    {
      id: 'm-34',
      author: 'Wren Adeyemi',
      body: 'Attaching the credit note. Let me know if the finance portal still shows the old figure.',
      at: demoDate(-1, 16, 40),
      outgoing: true,
      state: 'delivered',
      attachment: { name: 'credit-note-4471.pdf', size: '96 KB' },
    },
  ],
  'c-2028': [
    {
      id: 'm-41',
      author: 'Takeshi Arai',
      body: 'We are rotating the webhook signing key on our side. Our verifier only holds one key at a time, so we need a clean window.',
      at: demoDate(-2, 9, 30),
      outgoing: false,
    },
    {
      id: 'm-42',
      author: 'Rafiq Haddad',
      body: 'We can publish both keys and sign with the old one for seven days, then switch. That gives you a window with no gap.',
      at: demoDate(-2, 9, 48),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-43',
      author: 'Takeshi Arai',
      body: 'We can cut over on the 22nd if you publish the second key a week early.',
      at: demoDate(-1, 11, 5),
      outgoing: false,
      attachment: { name: 'rotation-plan.pdf', size: '412 KB' },
    },
  ],
  'c-2024': [
    {
      id: 'm-51',
      author: 'Colette Reyes',
      body: 'Requesting a callback — our purchase orders are being approved by one person and the audit team has flagged it.',
      at: demoDate(-2, 14, 10),
      outgoing: false,
    },
    {
      id: 'm-52',
      author: 'Wren Adeyemi',
      body: 'Called at 15:10. We walked through approval chains and set a two-approver threshold above 5,000.',
      at: demoDate(-2, 15, 22),
      outgoing: true,
      state: 'read',
      internal: true,
    },
    {
      id: 'm-53',
      author: 'Wren Adeyemi',
      body: 'Summary of the call is in the thread. Two approvers to add before Friday.',
      at: demoDate(-2, 15, 30),
      outgoing: true,
      state: 'read',
      attachment: { name: 'call-notes-verdant.doc', size: '28 KB' },
    },
  ],
  'c-2019': [
    {
      id: 'm-61',
      author: 'Wren Adeyemi',
      body: 'Handover for the weekend: three escalations open, one waiting on the customer since Thursday.',
      at: demoDate(-3, 17, 40),
      outgoing: true,
      state: 'read',
    },
    {
      id: 'm-62',
      author: 'Priya Venkatesan',
      body: 'Noted. I will pick up the waiting one on Monday if it has not moved.',
      at: demoDate(-3, 17, 44),
      outgoing: false,
    },
    {
      id: 'm-63',
      author: 'Wren Adeyemi',
      body: 'Three open, one waiting on the customer. Notes in the shared doc.',
      at: demoDate(-3, 17, 48),
      outgoing: true,
      state: 'read',
      attachment: { name: 'handover-week-37.doc', size: '44 KB' },
    },
  ],
}

/** Reply-time and volume headline for the messaging desk. */
export const msgPulse = {
  openConversations: 34,
  openDelta: 0.08,
  awaitingReply: 9,
  awaitingDelta: -0.22,
  /** Minutes. Fractional, so the tile needs `decimals`. */
  medianFirstReply: 6.4,
  firstReplyDelta: -0.17,
  resolvedToday: 27,
  resolvedDelta: 0.12,
  /** 14-day trails for the tile sparklines, each landing on today's value. */
  openTrend: ramp(0x51A7, 14, 31, 34),
  awaitingTrend: ramp(0x2C41, 14, 12, 9),
  firstReplyTrend: ramp(0x77B3, 14, 7.7, 6.4, 0.08, 1),
  resolvedTrend: ramp(0x93E5, 14, 24, 27),
}

/* =========================================================================
   2 · Jobs — applicant tracking
   ====================================================================== */

export const ATS_STAGES = ['Applied', 'Screen', 'Interview', 'Onsite', 'Offer'] as const
export type AtsStage = typeof ATS_STAGES[number]

export type AtsRoleState = 'open' | 'interviewing' | 'offer out' | 'on hold'
export type AtsSource = 'Referral' | 'Careers site' | 'LinkedIn' | 'Agency' | 'Event'

export interface AtsRole {
  id: string
  title: string
  team: string
  location: string
  employment: 'Full-time' | 'Contract'
  level: string
  /** Days since the requisition opened. */
  openedDays: number
  /** Headcount approved for this requisition. */
  seats: number
  state: AtsRoleState
  manager: string
  salaryBand: string
}

export const atsRoles: AtsRole[] = [
  {
    id: 'r-401',
    title: 'Senior Platform Engineer',
    team: 'Platform',
    location: 'Helsinki · Hybrid',
    employment: 'Full-time',
    level: 'L5',
    openedDays: 46,
    seats: 2,
    state: 'interviewing',
    manager: 'Bjorn Aaltonen',
    salaryBand: '€92k – €118k',
  },
  {
    id: 'r-402',
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote · EU',
    employment: 'Full-time',
    level: 'L4',
    openedDays: 31,
    seats: 1,
    state: 'offer out',
    manager: 'Colette Nkemdirim',
    salaryBand: '€74k – €90k',
  },
  {
    id: 'r-403',
    title: 'Support Specialist',
    team: 'Support',
    location: 'Lagos · On-site',
    employment: 'Full-time',
    level: 'L2',
    openedDays: 18,
    seats: 3,
    state: 'open',
    manager: 'Priya Venkatesan',
    salaryBand: '₦ band C',
  },
  {
    id: 'r-404',
    title: 'Data Analyst',
    team: 'Data',
    location: 'Utrecht · Hybrid',
    employment: 'Full-time',
    level: 'L3',
    openedDays: 64,
    seats: 1,
    state: 'interviewing',
    manager: 'Soraya Kwan',
    salaryBand: '€61k – €78k',
  },
  {
    id: 'r-405',
    title: 'Technical Writer',
    team: 'Content',
    location: 'Remote · Global',
    employment: 'Contract',
    level: 'L3',
    openedDays: 12,
    seats: 1,
    state: 'open',
    manager: 'Maren Holloway',
    salaryBand: '€480 / day',
  },
  {
    id: 'r-406',
    title: 'Account Executive, Mid-Market',
    team: 'Revenue',
    location: 'Madrid · Hybrid',
    employment: 'Full-time',
    level: 'L4',
    openedDays: 88,
    seats: 2,
    state: 'on hold',
    manager: 'Marisol Duarte',
    salaryBand: '€58k + OTE',
  },
]

export interface AtsApplicant {
  id: string
  name: string
  roleId: string
  stage: AtsStage
  source: AtsSource
  /** Scorecard average, 0–100. */
  score: number
  location: string
  appliedDays: number
  daysInStage: number
  recruiter: string
  /** Last written feedback, shown in the row's expanded detail. */
  note: string
}

const ATS_NAMES = [
  'Oyelaran Bankole', 'Mireille Chastain', 'Dov Yaakobi', 'Anneke Visser',
  'Tomás Quiroga', 'Zeynep Kaya', 'Kwabena Mensah', 'Linnea Wikström',
  'Rashid Al-Suwaidi', 'Petra Novotná', 'Ifeoma Chukwu', 'Gustav Rehnqvist',
  'Marisol Ferrer', 'Aniket Deshmukh', 'Beatrix Halász', 'Yuki Nakashima',
  'Damilola Ajayi', 'Sanne de Groot', 'Emiliano Bruni', 'Noor Haddad',
  'Casimir Lefevre', 'Thandiwe Mokoena', 'Rurik Vasiliev', 'Ines Cardoso',
  'Hamza Cherif', 'Greta Lindholm', 'Julio Sanabria', 'Meike Brandt',
  'Farhan Qureshi', 'Adaeze Nwosu', 'Solveig Dahl', 'Mattia Ferraro',
  'Yara Shammas', 'Bastien Roussel', 'Chiara Lombardi', 'Nikhil Iyer',
  'Aurelie Tremblay', 'Sipho Dlamini', 'Karolina Zielinska', 'Hugo Almeida',
  'Leila Mansouri', 'Owen Fitzgerald', 'Malia Tupou', 'Dmitri Sokolov',
  'Rhiannon Price', 'Tarek Boulos', 'Elsa Bergqvist', 'Joaquín Vidal',
]

const ATS_LOCATIONS = [
  'Helsinki, FI', 'Lisbon, PT', 'Lagos, NG', 'Utrecht, NL', 'Madrid, ES',
  'Kraków, PL', 'Nairobi, KE', 'Tallinn, EE', 'Porto, PT', 'Berlin, DE',
]

const ATS_SOURCES: AtsSource[] = ['Referral', 'Careers site', 'LinkedIn', 'Agency', 'Event']

const ATS_RECRUITERS = ['Wren Adeyemi', 'Priya Venkatesan', 'Rafiq Haddad', 'Marisol Duarte']

const ATS_NOTES = [
  'Strong systems answer; wants a written design round before onsite.',
  'Portfolio depth is good, product sense still to be probed.',
  'Referred by the platform team — fast to respond, flexible start date.',
  'Salary expectation sits above band; recruiter to confirm flexibility.',
  'Came through the meetup; light on scale but excellent fundamentals.',
  'Second interview rescheduled once at the candidate’s request.',
  'Take-home returned early and was unusually clear.',
  'Panel split on depth; debrief scheduled with the hiring manager.',
]

/**
 * Applicants are generated so the pipeline, the per-role counts and the source
 * mix can all be DERIVED from this one list. Nothing downstream stores a count
 * that could drift out of step with the rows on screen.
 */
export const atsApplicants: AtsApplicant[] = (() => {
  const pick = stream(0xA75C)
  // Stage weights taper towards the offer end, so the funnel narrows naturally.
  const stageDeck: AtsStage[] = [
    'Applied', 'Applied', 'Applied', 'Applied', 'Applied', 'Applied', 'Applied',
    'Screen', 'Screen', 'Screen', 'Screen', 'Screen',
    'Interview', 'Interview', 'Interview',
    'Onsite', 'Onsite',
    'Offer',
  ]
  // On-hold and freshly-opened roles pull fewer applicants than mature ones.
  const roleDeck = [
    'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401', 'r-401',
    'r-402', 'r-402', 'r-402', 'r-402', 'r-402', 'r-402', 'r-402', 'r-402',
    'r-403', 'r-403', 'r-403', 'r-403', 'r-403', 'r-403', 'r-403', 'r-403', 'r-403', 'r-403',
    'r-404', 'r-404', 'r-404', 'r-404', 'r-404', 'r-404', 'r-404',
    'r-405', 'r-405', 'r-405', 'r-405',
    'r-406', 'r-406', 'r-406',
  ]

  return ATS_NAMES.map((name, i) => {
    const stage = stageDeck[Math.floor(pick() * stageDeck.length)]!
    const stageIndex = ATS_STAGES.indexOf(stage)
    const roleId = roleDeck[Math.floor(pick() * roleDeck.length)]!
    // Deeper stages carry a higher scorecard average — that is what moved them.
    const score = Math.round(54 + stageIndex * 7 + pick() * 16)
    return {
      id: `a-${5100 + i}`,
      name,
      roleId,
      stage,
      source: ATS_SOURCES[Math.floor(pick() * ATS_SOURCES.length)]!,
      score: Math.min(98, score),
      location: ATS_LOCATIONS[Math.floor(pick() * ATS_LOCATIONS.length)]!,
      appliedDays: 3 + stageIndex * 6 + Math.floor(pick() * 11),
      daysInStage: 1 + Math.floor(pick() * (3 + stageIndex * 4)),
      recruiter: ATS_RECRUITERS[Math.floor(pick() * ATS_RECRUITERS.length)]!,
      note: ATS_NOTES[Math.floor(pick() * ATS_NOTES.length)]!,
    }
  })
})()

export type AtsInterviewKind = 'Screen' | 'Technical' | 'Portfolio' | 'Panel' | 'Debrief'

export interface AtsInterview {
  id: string
  candidate: string
  roleId: string
  kind: AtsInterviewKind
  at: Date
  minutes: number
  panel: string[]
  remote: boolean
  /** Set when the candidate has not yet accepted the invitation. */
  unconfirmed?: boolean
}

export const atsInterviews: AtsInterview[] = [
  {
    id: 'i-1',
    candidate: 'Zeynep Kaya',
    roleId: 'r-401',
    kind: 'Technical',
    at: demoDate(0, 10, 30),
    minutes: 60,
    panel: ['Bjorn Aaltonen', 'Ivo Marchetti'],
    remote: true,
  },
  {
    id: 'i-2',
    candidate: 'Anneke Visser',
    roleId: 'r-402',
    kind: 'Portfolio',
    at: demoDate(0, 13, 0),
    minutes: 45,
    panel: ['Colette Nkemdirim'],
    remote: true,
  },
  {
    id: 'i-3',
    candidate: 'Kwabena Mensah',
    roleId: 'r-403',
    kind: 'Screen',
    at: demoDate(0, 15, 15),
    minutes: 30,
    panel: ['Wren Adeyemi'],
    remote: true,
    unconfirmed: true,
  },
  {
    id: 'i-4',
    candidate: 'Tomás Quiroga',
    roleId: 'r-401',
    kind: 'Panel',
    at: demoDate(1, 9, 0),
    minutes: 90,
    panel: ['Bjorn Aaltonen', 'Soraya Kwan', 'Priya Venkatesan'],
    remote: false,
  },
  {
    id: 'i-5',
    candidate: 'Linnea Wikström',
    roleId: 'r-404',
    kind: 'Technical',
    at: demoDate(1, 11, 30),
    minutes: 60,
    panel: ['Soraya Kwan'],
    remote: true,
  },
  {
    id: 'i-6',
    candidate: 'Mireille Chastain',
    roleId: 'r-402',
    kind: 'Debrief',
    at: demoDate(1, 16, 0),
    minutes: 30,
    panel: ['Colette Nkemdirim', 'Maren Holloway'],
    remote: true,
  },
  {
    id: 'i-7',
    candidate: 'Dov Yaakobi',
    roleId: 'r-401',
    kind: 'Screen',
    at: demoDate(2, 9, 45),
    minutes: 30,
    panel: ['Rafiq Haddad'],
    remote: true,
  },
  {
    id: 'i-8',
    candidate: 'Ifeoma Chukwu',
    roleId: 'r-403',
    kind: 'Panel',
    at: demoDate(2, 14, 0),
    minutes: 75,
    panel: ['Priya Venkatesan', 'Wren Adeyemi'],
    remote: false,
    unconfirmed: true,
  },
  {
    id: 'i-9',
    candidate: 'Petra Novotná',
    roleId: 'r-404',
    kind: 'Debrief',
    at: demoDate(3, 10, 0),
    minutes: 30,
    panel: ['Soraya Kwan', 'Marisol Duarte'],
    remote: true,
  },
  {
    id: 'i-10',
    candidate: 'Rashid Al-Suwaidi',
    roleId: 'r-405',
    kind: 'Screen',
    at: demoDate(3, 15, 30),
    minutes: 30,
    panel: ['Maren Holloway'],
    remote: true,
  },
]

export const atsPulse = {
  openRoles: atsRoles.filter(r => r.state !== 'on hold').length,
  openRolesDelta: 0.2,
  activeCandidates: atsApplicants.length,
  candidatesDelta: 0.14,
  /** Days. Fractional, so the tile needs `decimals`. */
  medianTimeToHire: 28.6,
  timeToHireDelta: -0.09,
  /** Share of offers accepted, as a fraction. */
  offerAcceptance: 0.82,
  acceptanceDelta: 0.05,
  applicantsTrend: ramp(0x1F4D, 14, 42, 48),
  timeToHireTrend: ramp(0x6B22, 14, 31.4, 28.6, 0.05, 1),
  acceptanceTrend: ramp(0x0D91, 14, 78, 82),
  openRolesTrend: ramp(0x4EA0, 14, 4, 5, 0.22),
}

/* =========================================================================
   3 · Writer — the editorial desk
   ====================================================================== */

export type EdStatus = 'draft' | 'in review' | 'scheduled' | 'published'

export interface EdArticle {
  id: string
  title: string
  section: string
  author: string
  authorRole: string
  status: EdStatus
  words: number
  /** Minutes. Fractional — a 4.5 minute read is not a 5 minute read. */
  readMins: number
  views: number
  /** Readers who reached the end. */
  completions: number
  shares: number
  /** Published date, scheduled date, or last edit — whichever the status implies. */
  at: Date
  /** Eight-point view trail for the row sparkline; empty for unpublished work. */
  trend: number[]
}

const EDITORIAL_SEED = [
  { title: 'What we learned rebuilding the import pipeline', section: 'Engineering', author: 'Bjorn Aaltonen', authorRole: 'Platform Engineer', status: 'published' as EdStatus, words: 2140, day: -3 },
  { title: 'A field guide to reading your own dashboards', section: 'Product', author: 'Maren Holloway', authorRole: 'Editorial Lead', status: 'published' as EdStatus, words: 1680, day: -5 },
  { title: 'Why we stopped colouring status by hue alone', section: 'Design', author: 'Colette Nkemdirim', authorRole: 'Design Director', status: 'published' as EdStatus, words: 1320, day: -8 },
  { title: 'Support metrics that survive contact with a Monday', section: 'Support', author: 'Priya Venkatesan', authorRole: 'Support Manager', status: 'published' as EdStatus, words: 1975, day: -11 },
  { title: 'Rotating webhook keys without a maintenance window', section: 'Engineering', author: 'Rafiq Haddad', authorRole: 'Solutions Architect', status: 'published' as EdStatus, words: 2460, day: -14 },
  { title: 'The quarterly close, in eleven fewer steps', section: 'Finance', author: 'Marisol Duarte', authorRole: 'Revenue Operations', status: 'published' as EdStatus, words: 1490, day: -17 },
  { title: 'Hiring for judgement when the résumé cannot show it', section: 'People', author: 'Wren Adeyemi', authorRole: 'Recruiter', status: 'published' as EdStatus, words: 1810, day: -21 },
  { title: 'Six months of SSO rollouts, and what broke', section: 'Engineering', author: 'Soraya Kwan', authorRole: 'Data Lead', status: 'published' as EdStatus, words: 2280, day: -25 },
  { title: 'Release notes nobody skips', section: 'Product', author: 'Maren Holloway', authorRole: 'Editorial Lead', status: 'scheduled' as EdStatus, words: 1240, day: 1 },
  { title: 'Designing the empty state before the full one', section: 'Design', author: 'Colette Nkemdirim', authorRole: 'Design Director', status: 'scheduled' as EdStatus, words: 1605, day: 3 },
  { title: 'How we size a support team for a product launch', section: 'Support', author: 'Priya Venkatesan', authorRole: 'Support Manager', status: 'scheduled' as EdStatus, words: 1385, day: 5 },
  { title: 'A changelog is a product surface', section: 'Product', author: 'Ivo Marchetti', authorRole: 'Staff Engineer', status: 'scheduled' as EdStatus, words: 990, day: 8 },
  { title: 'Reading a flame graph without the folklore', section: 'Engineering', author: 'Bjorn Aaltonen', authorRole: 'Platform Engineer', status: 'in review' as EdStatus, words: 2620, day: -1 },
  { title: 'Interviewing designers with a real brief', section: 'People', author: 'Wren Adeyemi', authorRole: 'Recruiter', status: 'in review' as EdStatus, words: 1730, day: -2 },
  { title: 'The cost of a chart that needs a legend', section: 'Design', author: 'Colette Nkemdirim', authorRole: 'Design Director', status: 'in review' as EdStatus, words: 1160, day: -1 },
  { title: 'Forecasting seats when your customers hire in waves', section: 'Finance', author: 'Marisol Duarte', authorRole: 'Revenue Operations', status: 'draft' as EdStatus, words: 840, day: 0 },
  { title: 'Everything we log, and why most of it is useless', section: 'Engineering', author: 'Ivo Marchetti', authorRole: 'Staff Engineer', status: 'draft' as EdStatus, words: 1290, day: -1 },
  { title: 'Onboarding a partner integration in a week', section: 'Product', author: 'Rafiq Haddad', authorRole: 'Solutions Architect', status: 'draft' as EdStatus, words: 610, day: -2 },
  { title: 'Notes on writing for people who are already annoyed', section: 'Support', author: 'Maren Holloway', authorRole: 'Editorial Lead', status: 'draft' as EdStatus, words: 430, day: 0 },
  { title: 'A data model for editorial calendars', section: 'Data', author: 'Soraya Kwan', authorRole: 'Data Lead', status: 'draft' as EdStatus, words: 1120, day: -4 },
]

export const edArticles: EdArticle[] = EDITORIAL_SEED.map((seed, i) => {
  const pick = stream(0xE117 + i * 97)
  const published = seed.status === 'published'
  // 238 words a minute, kept to one decimal — a 4.5 minute read is not a 5.
  const readMins = roundTo(seed.words / 238, 1)
  const views = published ? Math.round(2400 + pick() * 21000) : 0
  return {
    id: `p-${700 + i}`,
    title: seed.title,
    section: seed.section,
    author: seed.author,
    authorRole: seed.authorRole,
    status: seed.status,
    words: seed.words,
    readMins,
    views,
    completions: published ? Math.round(views * (0.38 + pick() * 0.3)) : 0,
    shares: published ? Math.round(views * (0.01 + pick() * 0.035)) : 0,
    at: demoDate(seed.day, 9, 0),
    trend: published ? drift(0xE117 + i * 13, 8, Math.max(60, views / 14), -0.06, 0.4) : [],
  }
})

export interface EdSlot {
  id: string
  /** Day offset from the demo epoch. */
  day: number
  title: string
  section: string
  author: string
  channel: 'Blog' | 'Newsletter' | 'Docs' | 'Social'
  timeHour: number
  timeMinute: number
}

/** The publishing strip — what goes out over the next fortnight. */
export const edSchedule: EdSlot[] = [
  { id: 's-1', day: 0, title: 'Weekly digest #37', section: 'Newsletter', author: 'Maren Holloway', channel: 'Newsletter', timeHour: 16, timeMinute: 0 },
  { id: 's-2', day: 1, title: 'Release notes nobody skips', section: 'Product', author: 'Maren Holloway', channel: 'Blog', timeHour: 9, timeMinute: 30 },
  { id: 's-3', day: 1, title: 'Import pipeline changelog', section: 'Engineering', author: 'Bjorn Aaltonen', channel: 'Docs', timeHour: 14, timeMinute: 0 },
  { id: 's-4', day: 3, title: 'Designing the empty state before the full one', section: 'Design', author: 'Colette Nkemdirim', channel: 'Blog', timeHour: 10, timeMinute: 0 },
  { id: 's-5', day: 4, title: 'Customer story — Halvard Freight', section: 'Product', author: 'Wren Adeyemi', channel: 'Social', timeHour: 12, timeMinute: 15 },
  { id: 's-6', day: 5, title: 'How we size a support team for a product launch', section: 'Support', author: 'Priya Venkatesan', channel: 'Blog', timeHour: 9, timeMinute: 0 },
  { id: 's-7', day: 7, title: 'Weekly digest #38', section: 'Newsletter', author: 'Maren Holloway', channel: 'Newsletter', timeHour: 16, timeMinute: 0 },
  { id: 's-8', day: 8, title: 'A changelog is a product surface', section: 'Product', author: 'Ivo Marchetti', channel: 'Blog', timeHour: 11, timeMinute: 0 },
  { id: 's-9', day: 10, title: 'SCIM mapping guide', section: 'Engineering', author: 'Rafiq Haddad', channel: 'Docs', timeHour: 13, timeMinute: 30 },
  { id: 's-10', day: 12, title: 'Quarterly editorial review', section: 'Data', author: 'Soraya Kwan', channel: 'Blog', timeHour: 15, timeMinute: 0 },
]

/** Twelve weeks of audience. Views and completed reads share a unit, so they
 *  belong on one plot; anything measured differently gets its own. */
export const EDITORIAL_WEEKS = 12
export const edWeekViews = drift(0xB2F1, EDITORIAL_WEEKS, 38000, 0.021, 0.16)
export const edWeekReads = edWeekViews.map((v, i) => Math.round(v * (0.42 + ((i * 7919) % 11) / 160)))

/** Average read time by section, in minutes — a different measure, its own plot. */
export const edSectionReadTime: Array<{ name: string, minutes: number }> = [
  { name: 'Engineering', minutes: 9.4 },
  { name: 'Product', minutes: 6.1 },
  { name: 'Design', minutes: 5.3 },
  { name: 'Support', minutes: 4.6 },
  { name: 'Finance', minutes: 6.8 },
  { name: 'People', minutes: 5.9 },
  { name: 'Data', minutes: 7.2 },
]

export const edPulse = {
  draftsInProgress: edArticles.filter(a => a.status === 'draft' || a.status === 'in review').length,
  draftsDelta: 0.09,
  publishedThisMonth: edArticles.filter(a => a.status === 'published').length,
  publishedDelta: 0.33,
  /** Minutes. Fractional, so the tile needs `decimals`. */
  avgReadMins: 6.8,
  readDelta: 0.11,
  /** Completed reads as a share of views. */
  engagement: 0.512,
  engagementDelta: 0.04,
  draftsTrend: ramp(0x3C55, 14, 7, 8, 0.18),
  publishedTrend: ramp(0x8A17, 14, 6, 8, 0.18),
  readTrend: ramp(0x2D6E, 14, 6.1, 6.8, 0.07, 1),
  engagementTrend: ramp(0x55C9, 14, 49, 51.2, 0.05, 1),
}

/** Section colour slots are assigned once, by name, and never cycled. */
export const EDITORIAL_SECTIONS = [
  'Engineering', 'Product', 'Design', 'Support', 'Finance', 'People', 'Data',
] as const
