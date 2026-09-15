import { isoDay } from '~/utils/datetime'

/**
 * Demo data for the utility layout pages (calendar, notifications, files, search).
 * Deterministic: a fixed epoch and a seeded stream, so SSR and client agree.
 */

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
const rand = seeded(90126)

export const TODAY_ISO = isoDay(0)

/* ---------------------------------------------------------------- calendar */

export type EventKind = 'incident' | 'release' | 'meeting' | 'leave' | 'review'

export interface CalEvent {
  id: number
  title: string
  day: string
  start: string
  end: string
  kind: EventKind
  attendees: string[]
  location?: string
}

export const eventKindLabel: Record<EventKind, string> = {
  incident: 'Incident',
  release: 'Release',
  meeting: 'Meeting',
  leave: 'Leave',
  review: 'Review',
}

export const calendarEvents: CalEvent[] = [
  { id: 1, title: 'Platform standup', day: isoDay(0), start: '09:30', end: '09:45', kind: 'meeting', attendees: ['Amara Osei', 'Tobias Lindqvist', 'Elif Demir'], location: 'Room 2 / Meet' },
  { id: 2, title: 'INC-2210 review', day: isoDay(0), start: '11:00', end: '12:00', kind: 'incident', attendees: ['Priya Raghunathan', 'Amara Osei'], location: 'War room' },
  { id: 3, title: 'Rate limiter rollout', day: isoDay(0), start: '15:00', end: '16:00', kind: 'release', attendees: ['Tobias Lindqvist'] },
  { id: 4, title: 'Design review — passkeys', day: isoDay(1), start: '10:00', end: '11:00', kind: 'review', attendees: ['Amara Osei', 'Lena Kowalski'] },
  { id: 5, title: 'Hiring panel', day: isoDay(1), start: '14:00', end: '15:30', kind: 'meeting', attendees: ['Nnamdi Okafor', 'Hiroshi Tanaka'] },
  { id: 6, title: 'Ingrid — annual leave', day: isoDay(2), start: '00:00', end: '23:59', kind: 'leave', attendees: ['Ingrid Sørensen'] },
  { id: 7, title: 'Quarterly access review', day: isoDay(3), start: '13:00', end: '14:00', kind: 'review', attendees: ['Fatima Al-Rashid'] },
  { id: 8, title: 'v2.15 cut', day: isoDay(4), start: '09:00', end: '09:30', kind: 'release', attendees: ['Tobias Lindqvist', 'Diego Moreno'] },
  { id: 9, title: 'Capacity planning', day: isoDay(-2), start: '11:00', end: '12:00', kind: 'meeting', attendees: ['Ingrid Sørensen', 'Amara Osei'] },
  { id: 10, title: 'Postmortem circulated', day: isoDay(-1), start: '16:00', end: '16:30', kind: 'incident', attendees: ['Priya Raghunathan'] },
  { id: 11, title: 'Billing service spike', day: isoDay(6), start: '10:00', end: '12:00', kind: 'review', attendees: ['Elif Demir'] },
  { id: 12, title: 'All-hands', day: isoDay(8), start: '16:00', end: '17:00', kind: 'meeting', attendees: ['Amara Osei', 'Marcus Webb'] },
]

/* ----------------------------------------------------------- notifications */

export type NotifyKind = 'mention' | 'incident' | 'deploy' | 'billing' | 'access'

export interface Notification {
  id: number
  kind: NotifyKind
  title: string
  detail: string
  actor?: string
  at: string
  read: boolean
  actionable?: boolean
}

export const notifications: Notification[] = [
  { id: 1, kind: 'incident', title: 'INC-2214 opened', detail: 'Checkout latency above SLO in eu-west-1.', actor: 'Pager', at: '6m ago', read: false, actionable: true },
  { id: 2, kind: 'mention', title: 'Tobias mentioned you', detail: '“…can you confirm the clock source on PR #4821?”', actor: 'Tobias Lindqvist', at: '24m ago', read: false },
  { id: 3, kind: 'deploy', title: 'api-gateway v2.14.0 deployed', detail: 'Rolled out to production, 0 failed canaries.', actor: 'Amara Osei', at: '1h ago', read: false },
  { id: 4, kind: 'access', title: 'Access request', detail: 'Diego Moreno requested read access to billing-prod.', actor: 'Diego Moreno', at: '3h ago', read: true, actionable: true },
  { id: 5, kind: 'billing', title: 'Invoice INV-2041 paid', detail: '$240.00 charged to the card ending 4242.', at: 'Yesterday', read: true },
  { id: 6, kind: 'deploy', title: 'web v5.2.1 deployed', detail: 'Patch release — sparkline sizing fix.', actor: 'Elif Demir', at: 'Yesterday', read: true },
  { id: 7, kind: 'incident', title: 'INC-2210 resolved', detail: 'Rate limiter clock drift mitigated.', actor: 'Priya Raghunathan', at: '2 days ago', read: true },
  { id: 8, kind: 'mention', title: 'Lena mentioned you', detail: '“…the passkey enrolment copy needs a second pass.”', actor: 'Lena Kowalski', at: '3 days ago', read: true },
]

/* ------------------------------------------------------------ file manager */

export type FileKind = 'folder' | 'doc' | 'sheet' | 'image' | 'archive' | 'code' | 'pdf'

export interface FileNode {
  id: number
  name: string
  kind: FileKind
  size?: number
  owner: string
  modified: string
  starred?: boolean
  items?: number
}

export const fileKindIcon: Record<FileKind, string> = {
  folder: 'lucide:folder',
  doc: 'lucide:file-text',
  sheet: 'lucide:sheet',
  image: 'lucide:image',
  archive: 'lucide:file-archive',
  code: 'lucide:file-code',
  pdf: 'lucide:file-type',
}

export const files: FileNode[] = [
  { id: 1, name: 'Incident reports', kind: 'folder', owner: 'Priya Raghunathan', modified: '2026-09-14', items: 18 },
  { id: 2, name: 'Architecture', kind: 'folder', owner: 'Amara Osei', modified: '2026-09-11', items: 7, starred: true },
  { id: 3, name: 'Design exports', kind: 'folder', owner: 'Lena Kowalski', modified: '2026-09-09', items: 42 },
  { id: 4, name: 'INC-2210 postmortem.md', kind: 'doc', size: 24_800, owner: 'Priya Raghunathan', modified: '2026-09-15', starred: true },
  { id: 5, name: 'Capacity model Q4.xlsx', kind: 'sheet', size: 186_400, owner: 'Ingrid Sørensen', modified: '2026-09-13' },
  { id: 6, name: 'rate-limiter.patch', kind: 'code', size: 9_120, owner: 'Tobias Lindqvist', modified: '2026-09-12' },
  { id: 7, name: 'Access review 2026-Q3.pdf', kind: 'pdf', size: 512_000, owner: 'Fatima Al-Rashid', modified: '2026-09-08' },
  { id: 8, name: 'dashboard-shots.zip', kind: 'archive', size: 18_400_000, owner: 'Lena Kowalski', modified: '2026-09-06' },
  { id: 9, name: 'topology.png', kind: 'image', size: 1_240_000, owner: 'Amara Osei', modified: '2026-09-04' },
  { id: 10, name: 'Onboarding checklist.md', kind: 'doc', size: 11_200, owner: 'Nnamdi Okafor', modified: '2026-09-02' },
]

export const storageUsed = 38 // percent
export const storageBreakdown = [
  { name: 'Archives', value: 18_400_000 },
  { name: 'Images', value: 9_600_000 },
  { name: 'Documents', value: 4_200_000 },
  { name: 'Spreadsheets', value: 2_100_000 },
  { name: 'Code', value: 900_000 },
]

/* --------------------------------------------------------------- search */

export type ResultKind = 'person' | 'project' | 'document' | 'task' | 'setting'

export interface SearchResult {
  id: number
  kind: ResultKind
  title: string
  snippet: string
  meta: string
  score: number
}

export const searchResults: SearchResult[] = [
  { id: 1, kind: 'document', title: 'INC-2210 postmortem', snippet: 'The rate limiter began shedding traffic at 02:14 after an NTP step handed out a burst of free tokens…', meta: 'Incident reports · updated today', score: 0.98 },
  { id: 2, kind: 'task', title: 'Rate limiter: switch to monotonic clock', snippet: 'Urgent · assigned to Tobias Lindqvist · 3 of 5 subtasks complete', meta: 'Tasks · In progress', score: 0.94 },
  { id: 3, kind: 'person', title: 'Tobias Lindqvist', snippet: 'Engineer · Platform · tobias.lindqvist@example.com', meta: 'Members', score: 0.86 },
  { id: 4, kind: 'project', title: 'Rate limiter rewrite', snippet: '68% complete · due in 9 days · 4 contributors', meta: 'Projects', score: 0.81 },
  { id: 5, kind: 'setting', title: 'Rate limiting', snippet: 'Per-tenant request ceilings and burst allowance.', meta: 'Settings · Platform', score: 0.64 },
  { id: 6, kind: 'document', title: 'Capacity model Q4', snippet: 'Storage crosses 80% in approximately eleven weeks at the current slope…', meta: 'Architecture · updated 2 days ago', score: 0.58 },
  { id: 7, kind: 'task', title: 'Deprecate v1 webhooks', snippet: 'Low · assigned to Hiroshi Tanaka', meta: 'Tasks · Backlog', score: 0.41 },
]

export const resultKindMeta: Record<ResultKind, { icon: string, label: string }> = {
  person: { icon: 'lucide:user', label: 'People' },
  project: { icon: 'lucide:folder-kanban', label: 'Projects' },
  document: { icon: 'lucide:file-text', label: 'Documents' },
  task: { icon: 'lucide:square-check-big', label: 'Tasks' },
  setting: { icon: 'lucide:settings', label: 'Settings' },
}

export function formatBytes(n?: number) {
  if (n === undefined)
    return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`
  return `${n} B`
}

export const _rand = rand
