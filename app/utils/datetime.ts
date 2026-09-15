/**
 * Canonical date handling for the demo data.
 *
 * Previously each mock file carried its own epoch, its own month-name array and
 * its own near-duplicate formatters — twelve functions across four files, in two
 * different conventions (forward day-counts vs backward offsets) and two input
 * types (day-count vs Date). That fragmentation is what produced the duplicate
 * `formatMoney` collision, so it lives in one place now.
 *
 * Everything derives from a FIXED epoch and formats by hand — no wall-clock
 * reads, no `toLocaleString`. Node and the browser ship different ICU data, so
 * locale formatting makes SSR and client disagree and Vue reports a hydration
 * mismatch.
 */

export const DAY_MS = 86_400_000

/** The demo "today". Fixed so SSR and client always agree. */
export const DEMO_TODAY_MS = Date.UTC(2026, 8, 15)

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Monday-first, matching the calendar grids. */
export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Accepts a day offset from the demo epoch, or a Date directly. */
export type DayLike = number | Date

const pad2 = (n: number) => String(n).padStart(2, '0')

function toDate(value: DayLike): Date {
  return typeof value === 'number' ? new Date(DEMO_TODAY_MS + value * DAY_MS) : value
}

/**
 * A Date `days` from the demo epoch. Negative is the past.
 * Replaces the old `shiftDays` / `dayAt` pair.
 */
export function demoDate(days = 0, hour = 0, minute = 0): Date {
  return new Date(DEMO_TODAY_MS + days * DAY_MS + hour * 3_600_000 + minute * 60_000)
}

/** `2026-09-15` — safe as a map key or a `<time datetime>`. */
export function isoDay(value: DayLike = 0): string {
  return toDate(value).toISOString().slice(0, 10)
}

/** `15 Sep 2026` */
export function dayLabel(value: DayLike): string {
  const d = toDate(value)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** `15 Sep` */
export function shortDayLabel(value: DayLike): string {
  const d = toDate(value)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

/** `Sep 15` — month-first, for chart axis ticks. */
export function monthDayLabel(value: DayLike): string {
  const d = toDate(value)
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`
}

/** `Mon` */
export function weekdayLabel(value: DayLike): string {
  const d = toDate(value)
  return WEEKDAYS_SHORT[(d.getUTCDay() + 6) % 7]!
}

/** `15 Sep 2026 · 09:30` */
export function dayTimeLabel(value: DayLike): string {
  const d = toDate(value)
  return `${dayLabel(d)} · ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

/** `09:30` */
export function timeLabel(value: DayLike): string {
  const d = toDate(value)
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

/**
 * `today` / `in 3 days` / `2 weeks ago` / `3 months ago`.
 * Unifies the old `relativeLabel` (days+weeks) and `fromBase` (days+weeks+months)
 * on the richer three-tier scale.
 */
export function relativeLabel(value: DayLike): string {
  const days = typeof value === 'number'
    ? value
    : Math.round((value.getTime() - DEMO_TODAY_MS) / DAY_MS)

  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'

  const span = Math.abs(days)
  const unit = span < 14
    ? `${span} days`
    : span < 60
      ? `${Math.round(span / 7)} weeks`
      : `${Math.round(span / 30)} months`

  return days > 0 ? `in ${unit}` : `${unit} ago`
}
