// Daily activity rings, streaks and awards — computed from what is already logged (workouts,
// cardio, steps, water, food), so nothing new has to be tracked to fill them.
//
//  Move     — active calories: workouts by MET × body weight × time (Ainsworth et al.,
//             Compendium of Physical Activities 2011/2024: general resistance training
//             incl. rests between sets 3.5 MET, walking
//             with incline ~5, cycling 4–10 by speed, running ≈ speed in km/h) plus steps
//             (~0.04 kcal per step at 70 kg).
//  Exercise — minutes of training (workout duration, capped at 3 h a day).
//  Water    — drinks logged against the day's water target.
import { isoOf, todayISO } from './format.js'
import { lastBW, effectiveRoutine, streakWeeks } from './history.js'
import { targetsOf, waterTargetOf, dayTotals } from './nutrition.js'
import { EXIDX } from './exercises.js'

const LB = 2.20462
export const MOVE_GOALS = { fatloss: 500, tone: 400, muscle: 350 }
export const EXERCISE_GOAL = 30

const kgOf = S => {
  const bw = lastBW(S)
  return bw ? (S.unit === 'lb' ? bw.w / LB : bw.w) : (S.profile?.weightKg || 70)
}

function cardioMet(id, speed) {
  const n = (EXIDX[id]?.n || '').toLowerCase()
  if (n.includes('bike') || n.includes('cycle')) return speed >= 22 ? 10 : speed >= 19 ? 8 : speed >= 16 ? 6.8 : 4
  if (n.includes('run') || n.includes('jump rope')) return Math.max(7, speed || 8)
  return 5   // walking on incline, elliptical, stepmill, other conditioning
}

// Quick-logged workouts (any activity, like the Workout app's types): MET at a moderate effort
// (Compendium of Physical Activities), scaled by the logged effort 1–10 (5 = moderate).
export const ACTIVITY_TYPES = [
  ['run', 'Run', 'figureRun', 9.8], ['walk', 'Walk', 'figureRun', 3.5], ['hike', 'Hike', 'figureRun', 6],
  ['cycle', 'Cycle', 'bike', 7.5], ['swim', 'Swim', 'swim', 7], ['hiit', 'HIIT', 'bolt', 8],
  ['strength', 'Strength', 'dumbbell', 3.5], ['yoga', 'Yoga', 'stretch', 2.5], ['pilates', 'Pilates', 'stretch', 3],
  ['dance', 'Dance', 'heart', 5], ['sports', 'Sports', 'medal', 7], ['boxing', 'Boxing', 'boxing', 7.8],
  ['row', 'Rowing', 'figureStrength', 7], ['stairs', 'Stairs', 'figureRun', 8.8], ['elliptical', 'Elliptical', 'figureRun', 5], ['other', 'Other', 'flame', 4]
]
export const activityBurn = (a, kg) => {
  const met = (ACTIVITY_TYPES.find(x => x[0] === a.type) || ACTIVITY_TYPES.at(-1))[3]
  const k = 0.6 + 0.08 * (a.effort || 5)   // effort 5 → ×1.0, effort 10 → ×1.4, effort 1 → ×0.68
  return Math.round(met * k * kg * (a.min || 0) / 60)
}

// Minutes and active kcal of one finished workout. Logged cardio sets carry their own minutes
// and speed; the rest of the session is counted as resistance training.
export function workoutBurn(w, kg) {
  const total = w.start && w.end ? Math.min(180, Math.max(0, (w.end - w.start) / 60000)) : 0
  let cardioMin = 0, kcal = 0
  for (const e of w.entries || []) for (const s of e.sets || []) {
    if (s.done && s.min > 0) { cardioMin += s.min; kcal += cardioMet(e.id, s.speed) * kg * s.min / 60 }
  }
  const minutes = Math.max(total, cardioMin)
  kcal += 3.5 * kg * Math.max(0, minutes - cardioMin) / 60
  return { minutes: Math.round(minutes), kcal: Math.round(kcal) }
}

export function dayActivity(S, iso) {
  const kg = kgOf(S)
  let minutes = 0, kcal = 0
  for (const w of S.workouts || []) if (w.d === iso) { const b = workoutBurn(w, kg); minutes += b.minutes; kcal += b.kcal }
  for (const a of S.activities || []) if (a.d === iso) { minutes += a.min || 0; kcal += activityBurn(a, kg) }
  const steps = (S.steps || {})[iso] || 0
  kcal += Math.round(steps * 0.04 * kg / 70)
  const prof = S.profile && !S.profile.skipped ? S.profile : null
  const tg = prof ? targetsOf(prof, kg) : null
  const water = (S.water || {})[iso] || 0
  const waterGoal = waterTargetOf(tg, !!effectiveRoutine(S, iso))
  const food = dayTotals((S.food || {})[iso])
  const moveGoal = S.moveGoal || MOVE_GOALS[prof?.goal] || 400
  const exGoal = S.exerciseGoal || EXERCISE_GOAL
  const wGoal = S.waterGoal ? S.waterGoal + (effectiveRoutine(S, iso) ? 500 : 0) : waterGoal
  return {
    iso, kcal, minutes: Math.min(180, minutes), steps, water, food, tg,
    move: { v: kcal, goal: moveGoal, p: kcal / moveGoal },
    exercise: { v: Math.min(180, minutes), goal: exGoal, p: Math.min(180, minutes) / exGoal },
    hydrate: { v: water, goal: wGoal, p: water / wGoal },
    paused: isPaused(S, iso),
    protein: tg ? { v: food.p, goal: tg.protein, p: food.p / tg.protein } : null
  }
}

export const closed = a => a.move.p >= 1 && a.exercise.p >= 1 && a.hydrate.p >= 1

// Paused rings (rest day, illness, holiday): a paused day neither breaks nor extends a streak.
export const isPaused = (S, iso) => (S.ringPause || []).some(p => iso >= p.from && iso <= p.to)

const shift = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoOf(d) }
export const lastDays = (n, end = todayISO()) => Array.from({ length: n }, (_, i) => shift(end, i - n + 1))

// Days in a row a test passes, ending today — or yesterday, if today is not done yet.
export function streak(S, test, today = todayISO()) {
  let d = test(dayActivity(S, today)) ? today : shift(today, -1), n = 0
  for (let guard = 0; guard < 3650; guard++) {
    const a = dayActivity(S, d)
    if (a.paused && !test(a)) { d = shift(d, -1); continue }
    if (!test(a)) break
    n++; d = shift(d, -1)
  }
  return n
}
const longest = (S, test, days) => { let best = 0, cur = 0; for (const d of days) { const a = dayActivity(S, d); if (a.paused && !test(a)) continue; cur = test(a) ? cur + 1 : 0; best = Math.max(best, cur) } return best }

// Every calendar day from the first logged one to today — the range awards are checked over
// (all days, not just logged ones, so a gap breaks a streak).
function loggedDays(S) {
  const set = new Set([...(S.workouts || []).map(w => w.d), ...Object.keys(S.water || {}), ...Object.keys(S.food || {}), ...Object.keys(S.steps || {})])
  const first = [...set].sort()[0]
  if (!first) return []
  const out = [], end = todayISO()
  for (let d = first; d <= end && out.length < 3650; d = shift(d, 1)) out.push(d)
  return out
}

// Awards: [id, icon, title, how to earn, check(ctx) -> progress 0..1]
export const AWARDS = [
  ['first', 'dumbbell', 'First Workout', 'Finish your first workout', c => Math.min(1, c.workouts)],
  ['w10', 'medal', '10 Workouts', 'Finish 10 workouts', c => c.workouts / 10],
  ['w50', 'medal', '50 Workouts', 'Finish 50 workouts', c => c.workouts / 50],
  ['w100', 'trophy', '100 Club', 'Finish 100 workouts', c => c.workouts / 100],
  ['pr', 'trophy', 'Personal Record', 'Lift a new heaviest weight', c => Math.min(1, c.prs)],
  ['pr10', 'crown', 'Record Breaker', 'Set 10 personal records', c => c.prs / 10],
  ['move', 'flame', 'Move Goal', 'Close your Move ring', c => Math.min(1, c.bestMoveP)],
  ['double', 'bolt', 'Double Move', 'Burn twice your Move goal in a day', c => c.bestMoveP / 2],
  ['perfect', 'starFill', 'Perfect Day', 'Close all three rings in one day', c => Math.min(1, c.perfectDays)],
  ['perfect7', 'crown', 'Perfect Week', 'Close all rings 7 days in a row', c => c.perfectRun / 7],
  ['streak7', 'flame', '7-Day Streak', 'Close your Move ring 7 days in a row', c => c.moveRun / 7],
  ['streak30', 'rocket', '30-Day Streak', 'Close your Move ring 30 days in a row', c => c.moveRun / 30],
  ['hydro', 'heart', 'Hydration Hero', 'Hit your water goal 7 days in a row', c => c.waterRun / 7],
  ['protein', 'bolt', 'Protein Pro', 'Hit your protein goal 7 days in a row', c => c.proteinRun / 7],
  ['steps', 'figureRun', '10K Day', 'Walk 10,000 steps in a day', c => c.maxSteps / 10000],
  ['weeks4', 'calendar', 'Consistency', 'Train every week for 4 weeks', c => c.weeks / 4],
  ['early', 'sun', 'Early Bird', 'Start a workout before 7 am', c => (c.early ? 1 : 0)],
  ['night', 'moon', 'Night Owl', 'Start a workout after 9 pm', c => (c.night ? 1 : 0)],
  ['weigh30', 'scale', 'Scale Regular', 'Log your weight 30 times', c => c.weighIns / 30]
]

export function awardsOf(S) {
  const days = loggedDays(S)
  const acts = days.map(d => dayActivity(S, d))
  const hours = (S.workouts || []).filter(w => w.start).map(w => new Date(w.start).getHours())
  const c = {
    workouts: (S.workouts || []).length,
    prs: (S.workouts || []).reduce((n, w) => n + (w.prs || []).length, 0),
    bestMoveP: Math.max(0, ...acts.map(a => a.move.p)),
    perfectDays: acts.filter(closed).length,
    perfectRun: longest(S, closed, days),
    moveRun: longest(S, a => a.move.p >= 1, days),
    waterRun: longest(S, a => a.hydrate.p >= 1, days),
    proteinRun: longest(S, a => a.protein && a.protein.p >= 1, days),
    maxSteps: Math.max(0, ...Object.values(S.steps || {})),
    weeks: streakWeeks(S),
    early: hours.some(h => h < 7), night: hours.some(h => h >= 21),
    weighIns: (S.bodyweight || []).length
  }
  const list = AWARDS.map(([id, icon, title, how, f]) => {
    const p = Math.max(0, Math.min(1, f(c) || 0))
    return { id, icon, title, how, p, earned: p >= 1 }
  })
  // past months' challenges that were completed stay as awards; the current one shows progress
  const months = [...new Set(days.map(d => d.slice(0, 7)))]
  for (const m of months) {
    const end = m === todayISO().slice(0, 7) ? todayISO() : lastOfMonth(m)
    const mc = monthlyChallenge(S, end)
    if (mc.p >= 1 || m === todayISO().slice(0, 7)) {
      const name = new Date(m + '-15T12:00:00').toLocaleDateString('en', { month: 'long', year: 'numeric' })
      list.push({ id: 'month-' + m, icon: 'calendar', title: name + ' Challenge', how: 'Close your Move ring on 20 days this month', p: mc.p, earned: mc.p >= 1 })
    }
  }
  return list
}

// Trends: the last 90 days against the last 365 (as in the Fitness app). Needs some history —
// returns null for a metric with fewer than 14 logged days in the year.
export function trends(S, today = todayISO()) {
  const year = lastDays(365, today).map(d => dayActivity(S, d))
  const q = year.slice(-90)
  const metric = (key, get, unit, fmt = v => Math.round(v)) => {
    const vals = year.map(get), logged = vals.filter(v => v > 0).length
    if (logged < 14) return { key, unit, ready: false }
    const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length
    const recent = avg(q.map(get)), base = avg(vals)
    const dir = recent > base * 1.03 ? 'up' : recent < base * 0.97 ? 'down' : 'flat'
    return { key, unit, ready: true, recent: fmt(recent), base: fmt(base), dir }
  }
  const sleepOf = d => (S.sleep || {})[d.iso]?.h || 0
  return [
    metric('Move', d => d.move.v, 'kcal/day'),
    metric('Exercise', d => d.exercise.v, 'min/day'),
    metric('Steps', d => d.steps, 'steps/day'),
    metric('Water', d => d.hydrate.v / 1000, 'L/day', v => Math.round(v * 10) / 10),
    metric('Sleep', sleepOf, 'h/night', v => Math.round(v * 10) / 10),
    metric('Protein', d => d.food.p, 'g/day')
  ]
}

// Training load (acute:chronic): effort-weighted minutes over the last 7 days against the
// average week of the last 28. ~0.8–1.3 is a steady build; above ~1.5 is a jump that raises
// injury risk in team-sport data (Gabbett 2016) — a guide, not a diagnosis.
export function trainingLoad(S, today = todayISO()) {
  const kg = kgOf(S)
  const load = iso => {
    let n = 0
    for (const w of S.workouts || []) if (w.d === iso) n += workoutBurn(w, kg).minutes * (w.effort || 6)
    for (const a of S.activities || []) if (a.d === iso) n += (a.min || 0) * (a.effort || 5)
    return n
  }
  const days = lastDays(28, today).map(load)
  const acute = days.slice(-7).reduce((a, b) => a + b, 0)
  const chronic = days.reduce((a, b) => a + b, 0) / 4
  if (!chronic) return { acute, chronic, ratio: null, status: 'none' }
  const ratio = acute / chronic
  const status = ratio < 0.6 ? 'well-below' : ratio < 0.8 ? 'below' : ratio <= 1.3 ? 'steady' : ratio <= 1.5 ? 'above' : 'well-above'
  return { acute: Math.round(acute), chronic: Math.round(chronic), ratio: Math.round(ratio * 100) / 100, status, days: days.slice(-7) }
}

const lastOfMonth = m => { const d = new Date(m + '-01T12:00:00'); d.setMonth(d.getMonth() + 1); d.setDate(0); return isoOf(d) }

// This month's challenge: close the Move ring on 20 days of the month.
export function monthlyChallenge(S, today = todayISO()) {
  const month = today.slice(0, 7)
  const days = []
  for (let d = month + '-01'; d <= today; d = shift(d, 1)) days.push(d)
  const done = days.filter(d => dayActivity(S, d).move.p >= 1).length
  return { month, goal: 20, done, p: Math.min(1, done / 20) }
}
