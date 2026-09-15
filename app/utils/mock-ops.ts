import {
  demoDate,
  MONTHS_SHORT,
  monthDayLabel,
  weekdayLabel,
} from '~/utils/datetime'

/**
 * Demo data for the operations dashboards — people, delivery, company.
 *
 * Everything here is deterministic. The series come from local seeded walkers
 * (one stream per series, so adding a series never shifts the numbers of the
 * ones already drawn) and every date is derived from the fixed demo epoch in
 * `~/utils/datetime`. No wall-clock reads, no shared mutable stream: SSR and the
 * client compute the same values, so there is nothing for hydration to disagree
 * about.
 */

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** A gently drifting random walk. Own stream per call — never shared. */
function walkSeries(seed: number, n: number, start: number, drift = 0.01, vol = 0.06): number[] {
  const rand = seeded(seed)
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.max(1, v * (1 + drift + (rand() - 0.5) * vol))
    out.push(Math.round(v))
  }
  return out
}

/** Month short-names ending on the demo month, oldest first. */
function trailingMonths(count: number): string[] {
  const end = demoDate(0).getUTCMonth()
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--)
    out.push(MONTHS_SHORT[(end - i + 120) % 12]!)
  return out
}

const pct = (n: number) => Math.round(n * 1000) / 1000

/**
 * Rescale a walk so it lands exactly on a known figure, keeping its shape.
 * The tiles and the breakdown tables read from the same totals, so the trend
 * behind a number must end on that number.
 */
function endingAt(series: number[], target: number): number[] {
  const last = series.at(-1) ?? target
  const k = last ? target / last : 1
  return series.map((v, i) => (i === series.length - 1 ? target : Math.max(0, Math.round(v * k))))
}

/* ========================================================== human resources */

export interface HrPulse {
  headcount: number
  /** Period-over-period change, as a fraction. */
  headcountDelta: number
  joiners: number
  leavers: number
  openRoles: number
  openRolesDelta: number
  /** Median days from application to signed offer. */
  timeToHire: number
  timeToHireDelta: number
  /** Share of scheduled days lost to unplanned absence. */
  absenceRate: number
  absenceDelta: number
  offersOut: number
  startingSoon: number
}

/**
 * The department table below is the source of truth for the totals, so the
 * twelve-month walks are rescaled to land on it.
 */
const HR_HEADCOUNT = 411
const HR_OPEN_ROLES = 25

/** 12 months of headcount, oldest first. Drives the sparkline and the pulse. */
export const hrHeadcountTrend: number[] = endingAt(walkSeries(70213, 12, 372, 0.012, 0.018), HR_HEADCOUNT)
export const hrOpenRolesTrend: number[] = endingAt(walkSeries(41907, 12, 22, 0.02, 0.22), HR_OPEN_ROLES)
/** Tenths of a day — the walker works in integers. */
const hrTimeToHireTenths = walkSeries(85520, 12, 412, -0.008, 0.08)
/** Tenths of a percent. */
const hrAbsenceTenths = walkSeries(30884, 12, 30, 0.004, 0.16)

export const hrTimeToHireTrend: number[] = hrTimeToHireTenths
export const hrAbsenceTrend: number[] = hrAbsenceTenths

const hrLast = HR_HEADCOUNT
const hrPrev = hrHeadcountTrend.at(-2) ?? hrLast

export const hrPulse: HrPulse = {
  headcount: hrLast,
  headcountDelta: pct((hrLast - hrPrev) / hrPrev),
  joiners: 19,
  leavers: 7,
  openRoles: HR_OPEN_ROLES,
  openRolesDelta: 0.115,
  timeToHire: Math.round(hrTimeToHireTenths.at(-1) ?? 0) / 10,
  timeToHireDelta: -0.084,
  absenceRate: Math.round(hrAbsenceTenths.at(-1) ?? 0) / 10,
  absenceDelta: 0.061,
  offersOut: 14,
  startingSoon: 9,
}

export interface HrFunnelStage {
  name: string
  count: number
  icon: string
  /** What actually happens at this stage — the funnel is not self-explanatory. */
  note: string
}

/** Rolling 90 days of candidate flow, one row per stage. */
export const hrFunnel: HrFunnelStage[] = [
  { name: 'Applied', count: 1842, icon: 'lucide:inbox', note: 'Inbound and sourced, all requisitions' },
  { name: 'Screened', count: 604, icon: 'lucide:list-filter', note: 'Recruiter screen completed' },
  { name: 'Interviewed', count: 218, icon: 'lucide:users', note: 'Reached at least a panel loop' },
  { name: 'Offer', count: 57, icon: 'lucide:file-signature', note: 'Offer approved and extended' },
  { name: 'Hired', count: 41, icon: 'lucide:party-popper', note: 'Signed, start date agreed' },
]

export interface HrDepartment {
  name: string
  icon: string
  headcount: number
  open: number
  /** Net change in the last quarter. */
  net: number
  /** Trailing twelve-month voluntary attrition, as a fraction. */
  attrition: number
}

export const hrDepartments: HrDepartment[] = [
  { name: 'Engineering', icon: 'lucide:code-xml', headcount: 148, open: 9, net: 12, attrition: 0.061 },
  { name: 'Customer Success', icon: 'lucide:headset', headcount: 74, open: 4, net: 5, attrition: 0.138 },
  { name: 'Sales', icon: 'lucide:trending-up', headcount: 62, open: 6, net: -3, attrition: 0.184 },
  { name: 'Operations', icon: 'lucide:settings-2', headcount: 48, open: 2, net: 2, attrition: 0.092 },
  { name: 'Marketing', icon: 'lucide:megaphone', headcount: 33, open: 1, net: 1, attrition: 0.109 },
  { name: 'Finance & Legal', icon: 'lucide:scale', headcount: 27, open: 2, net: 0, attrition: 0.047 },
  { name: 'People', icon: 'lucide:heart-handshake', headcount: 19, open: 1, net: 2, attrition: 0.053 },
]

export interface HrLeaveDay {
  /** Offset from the demo epoch. Negative is the past. */
  day: number
  iso: string
  /** `Sep 15` */
  label: string
  /** `Mon` */
  weekday: string
  /** People away that day. */
  away: number
  weekend: boolean
  today: boolean
}

/** A three-week strip centred on today — five back, fifteen forward. */
export const hrLeaveStrip: HrLeaveDay[] = (() => {
  const rand = seeded(11284)
  const out: HrLeaveDay[] = []
  for (let day = -5; day <= 15; day++) {
    const date = demoDate(day)
    const dow = date.getUTCDay()
    const weekend = dow === 0 || dow === 6
    // Leave clusters around the late-September school break.
    const swell = day >= 6 && day <= 12 ? 9 : 0
    out.push({
      day,
      iso: date.toISOString().slice(0, 10),
      label: monthDayLabel(date),
      weekday: weekdayLabel(date),
      away: weekend ? 0 : Math.round(6 + swell + rand() * 7),
      weekend,
      today: day === 0,
    })
  }
  return out
})()

export type HrLeaveKind = 'Annual' | 'Parental' | 'Sick' | 'Study' | 'Sabbatical'

export interface HrLeaveEntry {
  id: string
  person: string
  role: string
  department: string
  kind: HrLeaveKind
  /** Offsets from the demo epoch. */
  startDay: number
  endDay: number
  days: number
  /** Who is holding the work while they are out. */
  cover: string
}

export const hrLeaveUpcoming: HrLeaveEntry[] = [
  { id: 'lv-4401', person: 'Nadia Okonkwo', role: 'Staff Engineer', department: 'Engineering', kind: 'Sabbatical', startDay: 1, endDay: 42, days: 30, cover: 'Priya Raman' },
  { id: 'lv-4402', person: 'Tomas Lindqvist', role: 'Account Executive', department: 'Sales', kind: 'Annual', startDay: 2, endDay: 9, days: 6, cover: 'Grace Oyelaran' },
  { id: 'lv-4403', person: 'Marisol Duarte', role: 'Support Lead', department: 'Customer Success', kind: 'Parental', startDay: 6, endDay: 118, days: 80, cover: 'Ken Abe' },
  { id: 'lv-4404', person: 'Devon Mackay', role: 'Data Analyst', department: 'Operations', kind: 'Study', startDay: 7, endDay: 11, days: 5, cover: 'Aisha Farouk' },
  { id: 'lv-4405', person: 'Henrik Bauer', role: 'Product Designer', department: 'Engineering', kind: 'Annual', startDay: 8, endDay: 19, days: 8, cover: 'Lena Vogt' },
  { id: 'lv-4406', person: 'Priya Raman', role: 'Engineering Manager', department: 'Engineering', kind: 'Annual', startDay: 12, endDay: 16, days: 5, cover: 'Sam Whitfield' },
]

export type HrReqStage = 'Drafting' | 'Sourcing' | 'Screening' | 'Interviewing' | 'Offer' | 'On hold'
export type HrPriority = 'Critical' | 'High' | 'Normal'

export interface HrRequisition {
  id: string
  title: string
  department: string
  location: string
  stage: HrReqStage
  priority: HrPriority
  owner: string
  /** Hiring manager plus the recruiter on the file. */
  panel: string[]
  applicants: number
  interviews: number
  /** Days since the requisition opened. */
  age: number
  /** Offset from the demo epoch for the target start date. */
  targetDay: number
}

export const hrRequisitions: HrRequisition[] = [
  { id: 'REQ-3120', title: 'Senior Platform Engineer', department: 'Engineering', location: 'Berlin · Hybrid', stage: 'Interviewing', priority: 'Critical', owner: 'Priya Raman', panel: ['Priya Raman', 'Sam Whitfield', 'Ivo Petrov'], applicants: 164, interviews: 11, age: 38, targetDay: 46 },
  { id: 'REQ-3121', title: 'Enterprise Account Executive', department: 'Sales', location: 'New York · Onsite', stage: 'Offer', priority: 'High', owner: 'Grace Oyelaran', panel: ['Grace Oyelaran', 'Tomas Lindqvist'], applicants: 92, interviews: 7, age: 54, targetDay: 30 },
  { id: 'REQ-3124', title: 'Support Engineer, EMEA', department: 'Customer Success', location: 'Lisbon · Remote', stage: 'Screening', priority: 'High', owner: 'Ken Abe', panel: ['Ken Abe', 'Marisol Duarte'], applicants: 211, interviews: 4, age: 17, targetDay: 61 },
  { id: 'REQ-3127', title: 'Payroll Specialist', department: 'Finance & Legal', location: 'Dublin · Hybrid', stage: 'Sourcing', priority: 'Normal', owner: 'Aisha Farouk', panel: ['Aisha Farouk'], applicants: 46, interviews: 0, age: 9, targetDay: 75 },
  { id: 'REQ-3129', title: 'Lifecycle Marketing Manager', department: 'Marketing', location: 'Remote · EU', stage: 'Interviewing', priority: 'Normal', owner: 'Lena Vogt', panel: ['Lena Vogt', 'Henrik Bauer'], applicants: 128, interviews: 6, age: 25, targetDay: 52 },
  { id: 'REQ-3131', title: 'Warehouse Operations Lead', department: 'Operations', location: 'Rotterdam · Onsite', stage: 'On hold', priority: 'Normal', owner: 'Devon Mackay', panel: ['Devon Mackay', 'Aisha Farouk'], applicants: 73, interviews: 2, age: 66, targetDay: 90 },
  { id: 'REQ-3133', title: 'Staff Product Designer', department: 'Engineering', location: 'Berlin · Hybrid', stage: 'Screening', priority: 'High', owner: 'Henrik Bauer', panel: ['Henrik Bauer', 'Priya Raman'], applicants: 187, interviews: 3, age: 12, targetDay: 68 },
  { id: 'REQ-3136', title: 'Revenue Operations Analyst', department: 'Sales', location: 'Austin · Hybrid', stage: 'Drafting', priority: 'Normal', owner: 'Sam Whitfield', panel: ['Sam Whitfield'], applicants: 0, interviews: 0, age: 3, targetDay: 104 },
  { id: 'REQ-3138', title: 'People Partner, Engineering', department: 'People', location: 'Remote · EU', stage: 'Interviewing', priority: 'High', owner: 'Aisha Farouk', panel: ['Aisha Farouk', 'Priya Raman'], applicants: 96, interviews: 8, age: 31, targetDay: 44 },
  { id: 'REQ-3140', title: 'Security Engineer', department: 'Engineering', location: 'Remote · Global', stage: 'Sourcing', priority: 'Critical', owner: 'Ivo Petrov', panel: ['Ivo Petrov', 'Sam Whitfield'], applicants: 58, interviews: 1, age: 6, targetDay: 82 },
]

/* ================================================================= delivery */

export const DLV_DAYS = 14

/** Chart ticks for the shipment-volume plot, oldest first. */
export const dlvDayLabels: string[] = Array.from(
  { length: DLV_DAYS },
  (_, i) => monthDayLabel(demoDate(i - (DLV_DAYS - 1))),
)

export const dlvDispatched: number[] = walkSeries(60411, DLV_DAYS, 1240, 0.006, 0.12)
export const dlvDelivered: number[] = walkSeries(60413, DLV_DAYS, 1190, 0.013, 0.10)

export interface DlvPulse {
  active: number
  activeDelta: number
  onTime: number
  onTimeDelta: number
  /** Door-to-door average, in days. */
  transitDays: number
  transitDelta: number
  exceptions: number
  exceptionsDelta: number
  deliveredToday: number
  lanes: number
}

export const dlvPulse: DlvPulse = {
  active: 3_418,
  activeDelta: 0.072,
  onTime: 0.942,
  onTimeDelta: 0.013,
  transitDays: 2.6,
  transitDelta: -0.041,
  exceptions: 37,
  exceptionsDelta: 0.216,
  deliveredToday: dlvDelivered.at(-1) ?? 0,
  lanes: 62,
}

export type DlvStatus = 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'exception'

export interface DlvShipment {
  id: string
  /** Consignment reference the warehouse actually reads out. */
  ref: string
  status: DlvStatus
  origin: string
  originCode: string
  destination: string
  destCode: string
  carrier: string
  service: string
  pieces: number
  weightKg: number
  /** How far along the lane, 0–1. */
  progress: number
  /** ETA as a day offset from the demo epoch, plus the wall time on that day. */
  etaDay: number
  eta: Date
  lastScan: string
}

function shipment(
  id: string,
  ref: string,
  status: DlvStatus,
  originCode: string,
  origin: string,
  destCode: string,
  destination: string,
  carrier: string,
  service: string,
  pieces: number,
  weightKg: number,
  progress: number,
  etaDay: number,
  etaHour: number,
  etaMinute: number,
  lastScan: string,
): DlvShipment {
  return {
    id,
    ref,
    status,
    origin,
    originCode,
    destination,
    destCode,
    carrier,
    service,
    pieces,
    weightKg,
    progress,
    etaDay,
    eta: demoDate(etaDay, etaHour, etaMinute),
    lastScan,
  }
}

export const dlvShipments: DlvShipment[] = [
  shipment('sh-90412', 'GRG-90412', 'out-for-delivery', 'RTM', 'Rotterdam', 'BER', 'Berlin', 'Northwind Freight', 'Express', 4, 118, 0.92, 0, 16, 40, 'On vehicle for delivery'),
  shipment('sh-90418', 'GRG-90418', 'in-transit', 'LHR', 'London', 'DUB', 'Dublin', 'Meridian Logistics', 'Standard', 12, 640, 0.58, 1, 11, 15, 'Departed Holyhead hub'),
  shipment('sh-90423', 'GRG-90423', 'exception', 'CDG', 'Paris', 'MAD', 'Madrid', 'Northwind Freight', 'Express', 2, 54, 0.41, 2, 9, 0, 'Held at customs, Irún'),
  shipment('sh-90427', 'GRG-90427', 'delivered', 'HAM', 'Hamburg', 'CPH', 'Copenhagen', 'Baltic Haul', 'Standard', 7, 305, 1, -1, 14, 25, 'Signed for at reception'),
  shipment('sh-90431', 'GRG-90431', 'picked-up', 'MXP', 'Milan', 'ZRH', 'Zurich', 'Alpine Cargo', 'Same-day', 1, 12, 0.08, 0, 21, 30, 'Collected from shipper'),
  shipment('sh-90435', 'GRG-90435', 'in-transit', 'BCN', 'Barcelona', 'LIS', 'Lisbon', 'Meridian Logistics', 'Standard', 18, 980, 0.66, 1, 17, 45, 'Line haul, Zaragoza'),
  shipment('sh-90440', 'GRG-90440', 'out-for-delivery', 'AMS', 'Amsterdam', 'BRU', 'Brussels', 'Northwind Freight', 'Express', 3, 76, 0.88, 0, 15, 10, 'Out with courier 214'),
  shipment('sh-90444', 'GRG-90444', 'exception', 'WAW', 'Warsaw', 'VNO', 'Vilnius', 'Baltic Haul', 'Standard', 9, 412, 0.73, 3, 12, 0, 'Vehicle breakdown, Białystok'),
  shipment('sh-90449', 'GRG-90449', 'in-transit', 'FRA', 'Frankfurt', 'VIE', 'Vienna', 'Alpine Cargo', 'Express', 5, 141, 0.35, 1, 8, 20, 'Scanned at Nuremberg'),
  shipment('sh-90452', 'GRG-90452', 'delivered', 'DUB', 'Dublin', 'LHR', 'London', 'Meridian Logistics', 'Express', 2, 33, 1, 0, 9, 5, 'Delivered to dock B'),
  shipment('sh-90458', 'GRG-90458', 'picked-up', 'OSL', 'Oslo', 'STO', 'Stockholm', 'Baltic Haul', 'Standard', 14, 720, 0.12, 2, 13, 0, 'Manifest accepted'),
  shipment('sh-90463', 'GRG-90463', 'in-transit', 'PRG', 'Prague', 'BUD', 'Budapest', 'Alpine Cargo', 'Standard', 6, 198, 0.49, 1, 19, 35, 'Crossed at Rajka'),
  shipment('sh-90467', 'GRG-90467', 'exception', 'MAD', 'Madrid', 'CDG', 'Paris', 'Northwind Freight', 'Express', 1, 9, 0.62, 2, 10, 45, 'Address unreadable on label'),
  shipment('sh-90471', 'GRG-90471', 'out-for-delivery', 'CPH', 'Copenhagen', 'HAM', 'Hamburg', 'Baltic Haul', 'Express', 8, 264, 0.9, 0, 18, 0, 'Out with courier 087'),
]

export interface DlvCarrier {
  name: string
  /** Loads booked against loads available this week. */
  used: number
  capacity: number
  onTime: number
  lanes: number
}

export const dlvCarriers: DlvCarrier[] = [
  { name: 'Northwind Freight', used: 1_284, capacity: 1_350, onTime: 0.961, lanes: 24 },
  { name: 'Meridian Logistics', used: 946, capacity: 1_200, onTime: 0.938, lanes: 18 },
  { name: 'Baltic Haul', used: 812, capacity: 820, onTime: 0.897, lanes: 12 },
  { name: 'Alpine Cargo', used: 376, capacity: 700, onTime: 0.954, lanes: 8 },
]

export type DlvSeverity = 'critical' | 'caution'

export interface DlvException {
  id: string
  ref: string
  reason: string
  detail: string
  severity: DlvSeverity
  lane: string
  owner: string
  /** How long the shipment has been stuck. */
  heldHours: number
  /** Value at risk, in dollars. */
  atRisk: number
}

export const dlvExceptions: DlvException[] = [
  { id: 'ex-771', ref: 'GRG-90444', reason: 'Vehicle breakdown', detail: 'Tractor unit failed near Białystok; recovery booked for 06:00.', severity: 'critical', lane: 'WAW → VNO', owner: 'Baltic Haul', heldHours: 19, atRisk: 41_200 },
  { id: 'ex-772', ref: 'GRG-90423', reason: 'Customs hold', detail: 'Commercial invoice missing HS codes on two of four lines.', severity: 'critical', lane: 'CDG → MAD', owner: 'Northwind Freight', heldHours: 31, atRisk: 18_450 },
  { id: 'ex-773', ref: 'GRG-90467', reason: 'Address unreadable', detail: 'Label scuffed in transit; consignee contacted for re-confirmation.', severity: 'caution', lane: 'MAD → CDG', owner: 'Northwind Freight', heldHours: 8, atRisk: 2_900 },
  { id: 'ex-774', ref: 'GRG-90391', reason: 'Refused at door', detail: 'Receiving dock closed for stocktake; redelivery slotted for Thursday.', severity: 'caution', lane: 'AMS → BRU', owner: 'Meridian Logistics', heldHours: 5, atRisk: 6_740 },
]

/* ================================================================== company */

export const EXEC_MONTHS = 12

export const execMonthLabels: string[] = trailingMonths(EXEC_MONTHS)

/** Recognised revenue per month, in dollars. */
export const execRevenueMonthly: number[] = walkSeries(22071, EXEC_MONTHS, 1_920_000, 0.028, 0.07)
/** Gross operating burn per month, in dollars. Never plotted on revenue's axis. */
export const execBurnMonthly: number[] = walkSeries(22072, EXEC_MONTHS, 2_400_000, 0.014, 0.05)

const execRevLast = execRevenueMonthly.at(-1) ?? 0
const execRevPrev = execRevenueMonthly.at(-2) ?? execRevLast
const execBurnLast = execBurnMonthly.at(-1) ?? 0
const execBurnPrev = execBurnMonthly.at(-2) ?? execBurnLast

export interface ExecPulse {
  revenue: number
  revenueDelta: number
  burn: number
  burnDelta: number
  /** Months of cash left at the current net burn. */
  runway: number
  runwayDelta: number
  headcount: number
  headcountDelta: number
  cash: number
  grossMargin: number
  netBurn: number
}

const execCash = 21_000_000
const EXEC_GROSS_MARGIN = 0.781
/** Cash out minus gross profit in — the number runway is actually divided by. */
const execNetBurn = Math.max(1, execBurnLast - execRevLast * EXEC_GROSS_MARGIN)

export const execPulse: ExecPulse = {
  revenue: execRevLast,
  revenueDelta: pct((execRevLast - execRevPrev) / execRevPrev),
  burn: execBurnLast,
  burnDelta: pct((execBurnLast - execBurnPrev) / execBurnPrev),
  runway: Math.round((execCash / execNetBurn) * 10) / 10,
  runwayDelta: 0.048,
  headcount: hrLast,
  headcountDelta: pct((hrLast - hrPrev) / hrPrev),
  cash: execCash,
  grossMargin: EXEC_GROSS_MARGIN,
  netBurn: Math.round(execNetBurn),
}

export interface ExecDepartment {
  name: string
  icon: string
  lead: string
  /** Quarterly budget, in dollars. */
  allocated: number
  used: number
  headcount: number
  /** Named commitment the budget is buying this quarter. */
  focus: string
}

export const execDepartments: ExecDepartment[] = [
  { name: 'Engineering', icon: 'lucide:code-xml', lead: 'Priya Raman', allocated: 6_400_000, used: 5_310_000, headcount: 148, focus: 'Platform re-architecture' },
  { name: 'Sales', icon: 'lucide:trending-up', lead: 'Grace Oyelaran', allocated: 3_900_000, used: 4_120_000, headcount: 62, focus: 'Enterprise motion in DACH' },
  { name: 'Customer Success', icon: 'lucide:headset', lead: 'Ken Abe', allocated: 2_300_000, used: 1_845_000, headcount: 74, focus: 'Onboarding time-to-value' },
  { name: 'Operations', icon: 'lucide:settings-2', lead: 'Devon Mackay', allocated: 1_750_000, used: 1_692_000, headcount: 48, focus: 'Carrier network expansion' },
  { name: 'Marketing', icon: 'lucide:megaphone', lead: 'Lena Vogt', allocated: 1_480_000, used: 1_104_000, headcount: 33, focus: 'Category launch campaign' },
  { name: 'Finance & Legal', icon: 'lucide:scale', lead: 'Marcus Reyn', allocated: 980_000, used: 742_000, headcount: 27, focus: 'Audit readiness' },
  { name: 'People', icon: 'lucide:heart-handshake', lead: 'Aisha Farouk', allocated: 720_000, used: 508_000, headcount: 19, focus: 'Manager training programme' },
]

/** Quarter-to-date spend, one slice per department. */
export const execSpendByDepartment: Array<{ name: string, value: number }> = execDepartments
  .map(d => ({ name: d.name, value: d.used }))

export type ExecGoalStatus = 'on-track' | 'at-risk' | 'off-track' | 'done'

export interface ExecGoal {
  id: string
  objective: string
  keyResult: string
  owner: string
  team: string
  /** Both 0–1: where we are, and where we should be by now. */
  progress: number
  pace: number
  status: ExecGoalStatus
  quarter: string
}

export const execGoals: ExecGoal[] = [
  { id: 'okr-1', objective: 'Make the platform boringly reliable', keyResult: '99.95% availability across all regions', owner: 'Priya Raman', team: 'Engineering', progress: 0.82, pace: 0.75, status: 'on-track', quarter: 'Q3' },
  { id: 'okr-2', objective: 'Win the mid-market', keyResult: '120 new logos between 50 and 500 seats', owner: 'Grace Oyelaran', team: 'Sales', progress: 0.61, pace: 0.75, status: 'at-risk', quarter: 'Q3' },
  { id: 'okr-3', objective: 'Cut time-to-value in half', keyResult: 'Median onboarding under 14 days', owner: 'Ken Abe', team: 'Customer Success', progress: 1, pace: 0.75, status: 'done', quarter: 'Q3' },
  { id: 'okr-4', objective: 'Open the European delivery network', keyResult: '60 active lanes with 94% on-time', owner: 'Devon Mackay', team: 'Operations', progress: 0.88, pace: 0.75, status: 'on-track', quarter: 'Q3' },
  { id: 'okr-5', objective: 'Build a category-defining brand', keyResult: '30% lift in unaided awareness', owner: 'Lena Vogt', team: 'Marketing', progress: 0.34, pace: 0.75, status: 'off-track', quarter: 'Q3' },
  { id: 'okr-6', objective: 'Get audit-ready ahead of the raise', keyResult: 'SOC 2 Type II with no major findings', owner: 'Aisha Farouk', team: 'Finance & Legal', progress: 0.72, pace: 0.75, status: 'on-track', quarter: 'Q3' },
]

export type ExecFeedKind = 'decision' | 'announcement' | 'risk' | 'milestone'

export interface ExecFeedItem {
  id: string
  kind: ExecFeedKind
  title: string
  detail: string
  actor: string
  /** Offset from the demo epoch. Negative is the past. */
  day: number
  /** Trailing detail — the forum the call was made in. */
  forum: string
}

export const execFeed: ExecFeedItem[] = [
  { id: 'fd-1', kind: 'decision', title: 'Rotterdam hub approved', detail: 'Second European hub signed off at $2.1M capex, live in Q1. Operations owns the build.', actor: 'Board', day: -1, forum: 'Board meeting' },
  { id: 'fd-2', kind: 'risk', title: 'Marketing awareness goal flagged off-track', detail: 'Category launch slipped a quarter; the KR moves to Q4 with a reduced target.', actor: 'Lena Vogt', day: -2, forum: 'Exec review' },
  { id: 'fd-3', kind: 'announcement', title: 'Sabbatical policy extended to all staff at four years', detail: 'Thirty paid days, bookable from the anniversary month. First cohort opens next week.', actor: 'Aisha Farouk', day: -4, forum: 'All hands' },
  { id: 'fd-4', kind: 'milestone', title: 'Onboarding median hit 13 days', detail: 'Customer Success closed the time-to-value objective a quarter early.', actor: 'Ken Abe', day: -6, forum: 'Ops weekly' },
  { id: 'fd-5', kind: 'decision', title: 'Hiring freeze lifted for Engineering only', detail: 'Nine requisitions unblocked; every other function stays on backfill-only until January.', actor: 'Exec team', day: -9, forum: 'Exec review' },
  { id: 'fd-6', kind: 'announcement', title: 'Series C process opens in November', detail: 'Data room work starts now; the audit must land before bankers are engaged.', actor: 'Aisha Farouk', day: -13, forum: 'Board meeting' },
]
