/**
 * Sample data for the vertical dashboards — trading, learning and clinical.
 *
 * Two rules hold this file together:
 *
 * 1. Nothing reads the wall clock. Every timestamp is derived from the fixed
 *    demo epoch through `~/utils/datetime`, so the server and the browser build
 *    the same strings and Vue never reports a hydration mismatch.
 * 2. Every pseudo-random series is drawn from its OWN seeded generator. A single
 *    shared stream makes a series depend on how many series were built before
 *    it, which turns any re-ordering — or a tree-shaken import — into silent
 *    data drift between renders.
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

/** Random walk with drift. Rounded at the source so every reader agrees. */
function wander(seed: number, n: number, start: number, drift: number, vol: number, decimals = 2): number[] {
  const next = rng(seed)
  const floor = start * 0.25
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(floor, v * (1 + drift + (next() - 0.5) * vol))
    out.push(round(v, decimals))
  }
  return out
}

/**
 * Noisy values around a mean, clamped to a band — vitals, scores, durations.
 * `slope` tilts the mean across the window (end value minus start, halved each
 * side of centre) so a metric can trend without a second generator.
 */
function jitter(seed: number, n: number, mean: number, spread: number, decimals = 1, min = -Infinity, max = Infinity, slope = 0): number[] {
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

/* =========================================================================
   Stocks — portfolio, watchlist, orders
   ====================================================================== */

/** Days of price history on file. The page reslices this, it never regenerates. */
export const STOCK_DAYS = 180

/** `Sep 15` ticks, oldest first. */
export const stockDayLabels: string[] = Array.from(
  { length: STOCK_DAYS },
  (_, i) => monthDayLabel(-(STOCK_DAYS - 1 - i)),
)

/** Fixed order — a sector keeps its chart slot wherever it appears. */
export const stockSectors = [
  'Technology',
  'Financials',
  'Industrials',
  'Healthcare',
  'Energy',
  'Consumer',
  'Utilities',
] as const

export type StockSector = (typeof stockSectors)[number]

export interface StockInstrument {
  symbol: string
  name: string
  sector: StockSector
  /** Shares held. Zero means watch-only. */
  shares: number
  /** Closing price per day, oldest first. */
  history: number[]
  /** Shares traded per day, oldest first. */
  volume: number[]
  last: number
  prevClose: number
  /** Change on the closing day, as a fraction: 0.021 = +2.1%. */
  changePct: number
}

interface InstrumentSpec {
  symbol: string
  name: string
  sector: StockSector
  shares: number
  start: number
  drift: number
  vol: number
  baseVolume: number
  seed: number
}

const INSTRUMENT_SPECS: InstrumentSpec[] = [
  { symbol: 'NVEX', name: 'Novex Compute', sector: 'Technology', shares: 320, start: 74.20, drift: 0.0038, vol: 0.052, baseVolume: 4_100_000, seed: 1013 },
  { symbol: 'PXLR', name: 'Pixelar Systems', sector: 'Technology', shares: 145, start: 131.40, drift: 0.0021, vol: 0.044, baseVolume: 1_850_000, seed: 2027 },
  { symbol: 'MERD', name: 'Meridian Bancorp', sector: 'Financials', shares: 540, start: 41.05, drift: 0.0012, vol: 0.029, baseVolume: 2_640_000, seed: 3041 },
  { symbol: 'ARBL', name: 'Arbor Logistics', sector: 'Industrials', shares: 260, start: 63.80, drift: 0.0009, vol: 0.034, baseVolume: 980_000, seed: 4057 },
  { symbol: 'CYTH', name: 'Cytheris Bio', sector: 'Healthcare', shares: 410, start: 28.60, drift: -0.0014, vol: 0.071, baseVolume: 3_200_000, seed: 5077 },
  { symbol: 'ORVA', name: 'Orvan Energy', sector: 'Energy', shares: 150, start: 96.30, drift: 0.0016, vol: 0.038, baseVolume: 1_120_000, seed: 6089 },
  { symbol: 'KLPT', name: 'Kelpoint Retail', sector: 'Consumer', shares: 300, start: 52.10, drift: -0.0006, vol: 0.041, baseVolume: 1_460_000, seed: 7103 },
  { symbol: 'TIDE', name: 'Tidewell Utilities', sector: 'Utilities', shares: 220, start: 38.45, drift: 0.0007, vol: 0.021, baseVolume: 720_000, seed: 8117 },
]

export const stockInstruments: StockInstrument[] = INSTRUMENT_SPECS.map((spec) => {
  const history = wander(spec.seed, STOCK_DAYS, spec.start, spec.drift, spec.vol, 2)
  // Volume is generated on its own stream, then nudged by the day's move —
  // big sessions trade heavier, which is the only correlation worth faking.
  const raw = jitter(spec.seed + 991, STOCK_DAYS, spec.baseVolume, spec.baseVolume * 0.42, 0, spec.baseVolume * 0.25)
  const volume = raw.map((v, i) => {
    const prev = history[i - 1] ?? history[i]!
    const move = Math.abs((history[i]! - prev) / prev)
    return Math.round(v * (1 + move * 6))
  })
  const last = history.at(-1)!
  const prevClose = history.at(-2) ?? last
  return {
    symbol: spec.symbol,
    name: spec.name,
    sector: spec.sector,
    shares: spec.shares,
    history,
    volume,
    last,
    prevClose,
    changePct: prevClose ? round((last - prevClose) / prevClose, 6) : 0,
  }
})

/** Uninvested cash. Settles the equity curve against the position values. */
export const stockCash = 48_250.4

/**
 * Account equity per day: positions marked to the close, plus cash.
 * Derived rather than invented, so the curve and the holdings can never
 * tell two different stories.
 */
export const stockEquity: number[] = Array.from({ length: STOCK_DAYS }, (_, i) =>
  round(stockInstruments.reduce((sum, inst) => sum + inst.shares * inst.history[i]!, 0) + stockCash, 2))

export const stockInvested = round(
  stockInstruments.reduce((sum, inst) => sum + inst.shares * inst.last, 0),
  2,
)

/** Cash the broker will lend against the settled balance. */
export const stockBuyingPower = round(stockCash * 1.85, 2)

export interface StockAllocationSlice {
  name: StockSector
  value: number
  /** Share of invested capital, as a fraction. */
  weight: number
}

export const stockAllocation: StockAllocationSlice[] = stockSectors
  .map((sector) => {
    const value = round(
      stockInstruments
        .filter(i => i.sector === sector)
        .reduce((sum, i) => sum + i.shares * i.last, 0),
      2,
    )
    return { name: sector, value, weight: round(value / stockInvested, 4) }
  })
  .filter(slice => slice.value > 0)

export type StockSide = 'buy' | 'sell'
export type StockFill = 'filled' | 'partial' | 'working' | 'cancelled'

export interface StockOrder {
  id: string
  symbol: string
  side: StockSide
  /** Shares requested. */
  qty: number
  /** Shares actually executed — below `qty` on a partial. */
  filled: number
  /** Average execution price, or the resting limit when nothing filled. */
  price: number
  status: StockFill
  /** `market` orders have no limit. */
  kind: 'market' | 'limit' | 'stop'
  at: Date
}

export const stockOrders: StockOrder[] = [
  { id: 'ORD-48812', symbol: 'NVEX', side: 'buy', qty: 60, filled: 60, price: 92.14, status: 'filled', kind: 'market', at: demoDate(0, 14, 32) },
  { id: 'ORD-48807', symbol: 'CYTH', side: 'sell', qty: 200, filled: 125, price: 24.80, status: 'partial', kind: 'limit', at: demoDate(0, 13, 5) },
  { id: 'ORD-48799', symbol: 'TIDE', side: 'buy', qty: 150, filled: 0, price: 40.10, status: 'working', kind: 'limit', at: demoDate(0, 10, 18) },
  { id: 'ORD-48780', symbol: 'ORVA', side: 'sell', qty: 40, filled: 40, price: 118.62, status: 'filled', kind: 'limit', at: demoDate(-1, 15, 47) },
  { id: 'ORD-48776', symbol: 'KLPT', side: 'buy', qty: 120, filled: 0, price: 47.50, status: 'cancelled', kind: 'stop', at: demoDate(-1, 11, 2) },
  { id: 'ORD-48761', symbol: 'MERD', side: 'buy', qty: 240, filled: 240, price: 44.06, status: 'filled', kind: 'market', at: demoDate(-2, 16, 9) },
  { id: 'ORD-48744', symbol: 'PXLR', side: 'sell', qty: 35, filled: 35, price: 158.90, status: 'filled', kind: 'limit', at: demoDate(-3, 9, 54) },
  { id: 'ORD-48730', symbol: 'ARBL', side: 'buy', qty: 80, filled: 55, price: 66.35, status: 'partial', kind: 'limit', at: demoDate(-3, 9, 31) },
]

/* =========================================================================
   Course — cohorts, catalogue, module funnel
   ====================================================================== */

export const COURSE_WEEKS = 16

/** Week-commencing labels, oldest first — `4 Jun`. */
export const courseWeekLabels: string[] = Array.from(
  { length: COURSE_WEEKS },
  (_, i) => shortDayLabel(-(COURSE_WEEKS - 1 - i) * 7),
)

/** New enrolments per week. */
export const courseEnrolments: number[] = wander(11_003, COURSE_WEEKS, 214, 0.021, 0.19, 0).map(Math.round)

/** Course completions recorded in the same week. */
export const courseCompletions: number[] = courseEnrolments.map((n, i) => {
  const rate = jitter(12_007 + i, 1, 0.63, 0.09, 4, 0.38, 0.86)[0]!
  return Math.round(n * rate)
})

/** Mean assessment score, as a percentage. */
export const courseScores: number[] = jitter(13_009, COURSE_WEEKS, 78.4, 5.6, 1, 62, 94, 4.8)

/** Cohorts running in each week. */
export const courseActiveCohorts: number[] = jitter(14_011, COURSE_WEEKS, 11, 3.2, 0, 6, 18, 3)

export interface CourseRow {
  id: string
  title: string
  track: string
  instructor: string
  /** Teaching assistants, shown as an avatar group beside the instructor. */
  assistants: string[]
  modules: number
  /** Modules the median learner has finished. */
  modulesDone: number
  learners: number
  /** Mean progress across enrolled learners, as a percentage. */
  progress: number
  avgScore: number
  /** Day offset from the demo epoch — always negative. */
  updated: number
}

export const courseTracks = ['Engineering', 'Design', 'Data', 'Leadership', 'Compliance'] as const

export const courseCatalog: CourseRow[] = [
  { id: 'C-2101', title: 'Systems Design Foundations', track: 'Engineering', instructor: 'Amara Osei', assistants: ['Tobias Lindqvist', 'Nils Berg'], modules: 12, modulesDone: 9, learners: 486, progress: 74, avgScore: 81.4, updated: -2 },
  { id: 'C-2104', title: 'Accessible Interface Patterns', track: 'Design', instructor: 'Priya Raghunathan', assistants: ['Marta Alves'], modules: 9, modulesDone: 7, learners: 362, progress: 81, avgScore: 84.9, updated: -1 },
  { id: 'C-2108', title: 'Applied Statistics for Product', track: 'Data', instructor: 'Hiroshi Tanaka', assistants: ['Lena Kowalski', 'Ruth Amadi', 'Joon-ho Park'], modules: 14, modulesDone: 6, learners: 521, progress: 46, avgScore: 72.1, updated: -4 },
  { id: 'C-2112', title: 'Leading Distributed Teams', track: 'Leadership', instructor: 'Fatima Al-Rashid', assistants: ['Diego Moreno'], modules: 8, modulesDone: 7, learners: 274, progress: 88, avgScore: 86.2, updated: -6 },
  { id: 'C-2117', title: 'Secure Data Handling', track: 'Compliance', instructor: 'Marcus Webb', assistants: [], modules: 6, modulesDone: 4, learners: 703, progress: 63, avgScore: 77.8, updated: -3 },
  { id: 'C-2123', title: 'Query Engines in Practice', track: 'Data', instructor: 'Lena Kowalski', assistants: ['Hiroshi Tanaka'], modules: 11, modulesDone: 4, learners: 198, progress: 38, avgScore: 69.5, updated: -9 },
  { id: 'C-2126', title: 'Design Systems at Scale', track: 'Design', instructor: 'Marta Alves', assistants: ['Priya Raghunathan', 'Sofia Duarte'], modules: 10, modulesDone: 8, learners: 341, progress: 79, avgScore: 83.1, updated: -5 },
  { id: 'C-2130', title: 'Incident Response Drills', track: 'Engineering', instructor: 'Tobias Lindqvist', assistants: ['Amara Osei'], modules: 7, modulesDone: 5, learners: 259, progress: 68, avgScore: 75.6, updated: -8 },
  { id: 'C-2134', title: 'Coaching Conversations', track: 'Leadership', instructor: 'Diego Moreno', assistants: ['Fatima Al-Rashid'], modules: 6, modulesDone: 3, learners: 167, progress: 52, avgScore: 80.3, updated: -12 },
  { id: 'C-2139', title: 'Records Retention Essentials', track: 'Compliance', instructor: 'Ruth Amadi', assistants: [], modules: 5, modulesDone: 5, learners: 612, progress: 94, avgScore: 88.7, updated: -7 },
  { id: 'C-2143', title: 'Streaming Pipelines', track: 'Data', instructor: 'Joon-ho Park', assistants: ['Lena Kowalski'], modules: 13, modulesDone: 5, learners: 233, progress: 41, avgScore: 70.9, updated: -10 },
  { id: 'C-2148', title: 'Prototyping with Motion', track: 'Design', instructor: 'Sofia Duarte', assistants: ['Marta Alves'], modules: 8, modulesDone: 6, learners: 289, progress: 72, avgScore: 82.4, updated: -2 },
]

export interface CourseCohort {
  key: string
  label: string
  learners: number
}

/** Fixed order — the funnel keeps its chart slots when the cohort changes. */
export const courseCohorts: CourseCohort[] = [
  { key: 'autumn', label: 'Autumn 26', learners: 486 },
  { key: 'summer', label: 'Summer 26', learners: 412 },
  { key: 'spring', label: 'Spring 26', learners: 377 },
]

export interface CourseStep {
  cohort: string
  order: number
  module: string
  /** Learners who opened the module. */
  reached: number
  /** Learners who finished it. */
  completed: number
}

const FUNNEL_MODULES = [
  'Orientation',
  'Core concepts',
  'Modelling',
  'Trade-offs',
  'Capacity lab',
  'Failure modes',
  'Case review',
  'Capstone',
]

/**
 * A funnel only tells the truth if it never widens, so `reached` is built by
 * shrinking the previous step rather than drawn independently.
 */
export const courseFunnel: CourseStep[] = courseCohorts.flatMap((cohort, ci) => {
  const drop = rng(21_011 + ci * 97)
  let reached = cohort.learners
  return FUNNEL_MODULES.map((module, i) => {
    if (i > 0) {
      // Modules 3 and 5 are the known walls; everything else leaks gently.
      const wall = i === 2 || i === 4 ? 0.19 : 0.07
      reached = Math.round(reached * (1 - wall - drop() * 0.06))
    }
    const completed = Math.round(reached * (0.78 + drop() * 0.16))
    return { cohort: cohort.key, order: i + 1, module, reached, completed }
  })
})

export interface CourseSession {
  id: string
  title: string
  cohort: string
  host: string
  mode: 'live' | 'lab' | 'office hours'
  at: Date
  minutes: number
  seats: number
  booked: number
}

export const courseSessions: CourseSession[] = [
  { id: 'S-701', title: 'Capacity planning walkthrough', cohort: 'Autumn 26', host: 'Amara Osei', mode: 'live', at: demoDate(0, 15, 0), minutes: 60, seats: 120, booked: 114 },
  { id: 'S-702', title: 'Accessibility audit clinic', cohort: 'Autumn 26', host: 'Priya Raghunathan', mode: 'lab', at: demoDate(1, 10, 30), minutes: 90, seats: 40, booked: 37 },
  { id: 'S-703', title: 'Statistics office hours', cohort: 'Summer 26', host: 'Hiroshi Tanaka', mode: 'office hours', at: demoDate(1, 17, 15), minutes: 45, seats: 80, booked: 29 },
  { id: 'S-704', title: 'Incident retro: payment outage', cohort: 'Autumn 26', host: 'Tobias Lindqvist', mode: 'live', at: demoDate(2, 13, 0), minutes: 75, seats: 150, booked: 141 },
  { id: 'S-705', title: 'Design tokens workshop', cohort: 'Spring 26', host: 'Marta Alves', mode: 'lab', at: demoDate(3, 9, 45), minutes: 120, seats: 30, booked: 30 },
  { id: 'S-706', title: 'Coaching practice pairs', cohort: 'Summer 26', host: 'Diego Moreno', mode: 'live', at: demoDate(4, 16, 0), minutes: 60, seats: 60, booked: 44 },
]

/* =========================================================================
   Health — daily metrics, sleep stages, vitals, care schedule
   ====================================================================== */

/**
 * Nights of readings on file. The page charts a shorter window and compares it
 * against the window immediately before it, so there has to be more history
 * here than any single view shows.
 */
export const HEALTH_DAYS = 56

export const healthDayLabels: string[] = Array.from(
  { length: HEALTH_DAYS },
  (_, i) => monthDayLabel(-(HEALTH_DAYS - 1 - i)),
)

export interface HealthMetric {
  key: string
  label: string
  unit: string
  icon: string
  /** Daily readings, oldest first. */
  history: number[]
  decimals: number
  /** True where a falling number is the better outcome. */
  lowerIsBetter: boolean
}

export const healthMetrics: HealthMetric[] = [
  { key: 'restingHr', label: 'Resting heart rate', unit: 'bpm', icon: 'lucide:heart-pulse', history: jitter(31_013, HEALTH_DAYS, 55.4, 5.2, 0, 44, 70, -5.4), decimals: 0, lowerIsBetter: true },
  { key: 'sleep', label: 'Sleep', unit: 'h', icon: 'lucide:moon', history: jitter(32_017, HEALTH_DAYS, 7.1, 1.45, 1, 4.6, 9.2, 1.1), decimals: 1, lowerIsBetter: false },
  { key: 'active', label: 'Active minutes', unit: 'min', icon: 'lucide:footprints', history: jitter(33_019, HEALTH_DAYS, 47, 31, 0, 8, 102, 21), decimals: 0, lowerIsBetter: false },
  { key: 'recovery', label: 'Recovery score', unit: '', icon: 'lucide:battery-charging', history: jitter(34_023, HEALTH_DAYS, 71, 18, 0, 34, 98, 13), decimals: 0, lowerIsBetter: false },
]

const sleepHistory = healthMetrics.find(m => m.key === 'sleep')!.history

/**
 * Sleep stages for the same nights the sleep metric reports, split so deep +
 * REM + core add back to the recorded sleep time and `awake` sits on top as
 * time in bed. Deriving them keeps the chart and the tile consistent.
 */
export const healthSleepStages = (() => {
  const mix = rng(35_027)
  const deep: number[] = []
  const rem: number[] = []
  const core: number[] = []
  const awake: number[] = []
  for (const hours of sleepHistory) {
    const d = round(hours * (0.14 + mix() * 0.08), 2)
    const r = round(hours * (0.18 + mix() * 0.09), 2)
    deep.push(d)
    rem.push(r)
    core.push(round(hours - d - r, 2))
    awake.push(round(0.15 + mix() * 0.55, 2))
  }
  return [
    { name: 'Deep', data: deep },
    { name: 'Core', data: core },
    { name: 'REM', data: rem },
    { name: 'Awake', data: awake },
  ]
})()

export interface HealthVital {
  name: string
  value: number
  unit: string
  /** Reference interval, inclusive at both ends. */
  low: number
  high: number
  decimals: number
  /** Day offset from the demo epoch — always negative or zero. */
  sampled: number
  source: string
}

export const healthVitals: HealthVital[] = [
  { name: 'Resting heart rate', value: 54, unit: 'bpm', low: 50, high: 70, decimals: 0, sampled: 0, source: 'Wearable' },
  { name: 'Systolic pressure', value: 132, unit: 'mmHg', low: 90, high: 120, decimals: 0, sampled: -1, source: 'Home cuff' },
  { name: 'Diastolic pressure', value: 83, unit: 'mmHg', low: 60, high: 80, decimals: 0, sampled: -1, source: 'Home cuff' },
  { name: 'Oxygen saturation', value: 97, unit: '%', low: 95, high: 100, decimals: 0, sampled: 0, source: 'Wearable' },
  { name: 'Respiration rate', value: 15.2, unit: '/min', low: 12, high: 20, decimals: 1, sampled: 0, source: 'Wearable' },
  { name: 'Heart rate variability', value: 36, unit: 'ms', low: 40, high: 100, decimals: 0, sampled: 0, source: 'Wearable' },
  { name: 'Body temperature', value: 36.8, unit: '°C', low: 36.1, high: 37.2, decimals: 1, sampled: -2, source: 'Home thermometer' },
  { name: 'Fasting glucose', value: 5.1, unit: 'mmol/L', low: 4.0, high: 5.6, decimals: 1, sampled: -12, source: 'Lab panel' },
  { name: 'Ferritin', value: 24, unit: 'µg/L', low: 30, high: 300, decimals: 0, sampled: -12, source: 'Lab panel' },
  { name: 'Total cholesterol', value: 5.4, unit: 'mmol/L', low: 3.0, high: 5.2, decimals: 1, sampled: -12, source: 'Lab panel' },
]

export type HealthCareKind = 'appointment' | 'lab' | 'review'

export interface HealthCareEvent {
  id: string
  kind: HealthCareKind
  title: string
  who: string
  place: string
  at: Date
  note?: string
  done: boolean
}

export const healthCare: HealthCareEvent[] = [
  { id: 'A-9012', kind: 'review', title: 'GP check-in', who: 'Dr. Noor Haddad', place: 'Ellis Road Practice', at: demoDate(-6, 10, 0), done: true, note: 'Cuff readings to be repeated at home for two weeks.' },
  { id: 'A-9027', kind: 'appointment', title: 'Cardiology review', who: 'Dr. Imani Okafor', place: 'St. Bede Cardiology', at: demoDate(2, 9, 30), done: false, note: 'Bring the two-week blood pressure log.' },
  { id: 'A-9031', kind: 'lab', title: 'Fasting blood panel', who: 'Pathology intake', place: 'Level 2, Ellis Road', at: demoDate(5, 7, 45), done: false, note: 'No food after 22:00 the night before.' },
  { id: 'A-9038', kind: 'appointment', title: 'Physiotherapy — session 4 of 8', who: 'Ana Ferreira', place: 'Riverside Rehab', at: demoDate(9, 16, 0), done: false },
  { id: 'A-9044', kind: 'review', title: 'Sleep clinic follow-up', who: 'Dr. Petra Vogel', place: 'Teleconsult', at: demoDate(16, 11, 15), done: false, note: 'Twenty-eight nights of stage data will be shared ahead of the call.' },
]

export type HealthDoseState = 'taken' | 'due' | 'scheduled' | 'missed'

export interface HealthDose {
  id: string
  drug: string
  dose: string
  purpose: string
  at: Date
  state: HealthDoseState
  withFood: boolean
}

export const healthDoses: HealthDose[] = [
  { id: 'M-01', drug: 'Metoprolol', dose: '25 mg', purpose: 'Blood pressure', at: demoDate(0, 8, 0), state: 'taken', withFood: true },
  { id: 'M-02', drug: 'Cholecalciferol', dose: '2000 IU', purpose: 'Vitamin D', at: demoDate(0, 8, 0), state: 'taken', withFood: true },
  { id: 'M-03', drug: 'Ferrous sulfate', dose: '200 mg', purpose: 'Low ferritin', at: demoDate(0, 12, 30), state: 'missed', withFood: false },
  { id: 'M-04', drug: 'Metformin', dose: '500 mg', purpose: 'Glucose control', at: demoDate(0, 13, 0), state: 'due', withFood: true },
  { id: 'M-05', drug: 'Atorvastatin', dose: '20 mg', purpose: 'Cholesterol', at: demoDate(0, 21, 0), state: 'scheduled', withFood: false },
  { id: 'M-06', drug: 'Melatonin', dose: '2 mg', purpose: 'Sleep onset', at: demoDate(0, 22, 30), state: 'scheduled', withFood: false },
]
