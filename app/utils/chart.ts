/**
 * Chart palette helpers.
 *
 * Slots are CSS variables so light/dark swap without re-rendering.
 * Order is fixed: a series keeps its slot for the life of the chart, so
 * filtering the series list never repaints the survivors.
 */
export const CHART_SLOTS = 7

export function slotColor(index: number): string {
  // Beyond the 7 documented slots callers must fold into "Other" rather
  // than generate a hue, so clamp instead of wrapping.
  const n = Math.min(index, CHART_SLOTS - 1) + 1
  return `var(--chart-${n})`
}

export interface Series {
  name: string
  data: number[]
  color?: string
}

/** Nice round axis bounds + ticks (1/2/5×10ⁿ progression). */
export function niceScale(min: number, max: number, ticks = 5) {
  if (min === max) { min = Math.min(0, min); max = max || 1 }
  const range = max - min
  const raw = range / ticks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = niceMin; v <= niceMax + step / 2; v += step)
    out.push(Number(v.toFixed(10)))
  return { min: niceMin, max: niceMax, ticks: out, step }
}

/** Catmull-Rom → cubic bézier, for smooth line/area charts. */
export function smoothPath(pts: Array<{ x: number, y: number }>, tension = 0.5): string {
  if (pts.length < 2)
    return pts.length ? `M${pts[0]!.x},${pts[0]!.y}` : ''

  let d = `M${pts[0]!.x},${pts[0]!.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

export function formatCompact(n: number, decimals = 1): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(decimals)}k`
  return String(Number(n.toFixed(decimals)))
}

/**
 * Deterministic number formatting.
 *
 * `toLocaleString` / `Intl.NumberFormat` depend on the ICU data built into the
 * runtime, and Node's differs from the browser's. That makes SSR and client
 * render different text, which Vue reports as a hydration mismatch and — where
 * it lands inside a larger tree — can fail the whole page. Group by hand so the
 * output is identical everywhere.
 */
export function groupInt(n: number): string {
  const neg = n < 0
  const digits = Math.abs(Math.trunc(n)).toString()
  let out = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0)
      out += ','
    out += digits[i]
  }
  return (neg ? '-' : '') + out
}

/** `1234.5` → `$1,234.50`. Takes a DECIMAL amount (not cents). */
export function formatCurrency(n: number, decimals = 2, currency = '$'): string {
  const neg = n < 0
  const abs = Math.abs(n)
  const whole = Math.trunc(abs)
  const frac = Math.round((abs - whole) * 10 ** decimals)
  // Rounding the fraction can carry into the whole part (e.g. 1.999 → 2.00).
  const carry = frac === 10 ** decimals
  const body = groupInt(carry ? whole + 1 : whole)
  const tail = decimals > 0 ? `.${String(carry ? 0 : frac).padStart(decimals, '0')}` : ''
  return `${neg ? '−' : ''}${currency}${body}${tail}`
}
