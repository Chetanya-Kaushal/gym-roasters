// Adaptive calorie target (the idea behind MacroFactor's "expenditure"): estimate what you
// actually burn from what you logged eating and how your weight moved, instead of trusting a
// formula. Energy balance: expenditure ≈ average intake − (weight change × 7700 kcal/kg) / days.
// The weight change is the slope of a least-squares line through the weigh-ins, so day-to-day
// water swings don't dominate and there is no smoothing lag.
import { isoOf, todayISO } from './format.js'
import { dayTotals } from './nutrition.js'

const LB = 2.20462

export function adaptiveTdee(S, days = 21, today = todayISO()) {
  const end = new Date(today + 'T12:00:00')
  const isos = Array.from({ length: days }, (_, i) => { const d = new Date(end); d.setDate(d.getDate() - (days - 1 - i)); return isoOf(d) })
  const intake = isos.map(d => dayTotals((S.food || {})[d]).kcal).filter(k => k > 400)   // skip unlogged/partial days
  const kg = w => (S.unit === 'lb' ? w / LB : w)
  const bw = (S.bodyweight || []).filter(b => b.d >= isos[0] && b.d <= today)
  if (intake.length < 14 || bw.length < 4) return { ready: false, foodDays: intake.length, weighIns: bw.length, need: { foodDays: 14, weighIns: 4 } }
  const t0 = new Date(bw[0].d)
  const pts = bw.map(b => [(new Date(b.d) - t0) / 86400000, kg(b.w)])
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length
  const den = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0)
  if (!den) return { ready: false, foodDays: intake.length, weighIns: bw.length, need: { foodDays: 14, weighIns: 4 } }
  const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / den   // kg per day
  const avgIn = intake.reduce((a, b) => a + b, 0) / intake.length
  const tdee = Math.round((avgIn - slope * 7700) / 10) * 10
  return { ready: true, tdee, avgIn: Math.round(avgIn), weeklyKg: Math.round(slope * 7 * 100) / 100, days }
}
