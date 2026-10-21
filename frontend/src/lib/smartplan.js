// Smart plan: a ready-made weekly plan picked from the answers to the onboarding questions
// (sex, goal, experience, days per week). Rule-based on purpose — it works offline, with no
// AI provider, and every choice traces back to a published guideline:
//
//  - Volume: a graded dose-response up to ~10+ hard sets per muscle per week (Schoenfeld,
//    Ogborn & Krieger 2016/2017), each muscle trained at least twice a week (Schoenfeld 2016).
//  - Loads/reps: 8–12 RM for novices, wider ranges for intermediates; add load once you beat
//    the top of the range by 1–2 reps (ACSM progression-models position stand, 2009).
//  - Sex: men and women gain muscle at a similar *relative* rate (Roberts, Nuckols & Krieger
//    2020; Refalo 2025), so the program is the same — the female variant only adds extra glute
//    work by default, a common preference, and the user can remove it like any exercise.
//  - Fat loss / "toning": no spot reduction; keep lifting to hold on to muscle in a deficit and
//    add cardio toward the WHO's 150–300 min/week of moderate activity.
import { uid } from './format.js'

export const SEXES = [['male', 'Male'], ['female', 'Female']]
export const GOALS = [
  ['fatloss', 'Lose weight', 'Burn fat, keep your muscle'],
  ['muscle', 'Build lean muscle', 'Get bigger and stronger'],
  ['tone', 'Tone & get fit', 'Lose a little fat, firm up, feel better']
]
export const LEVELS = [['beginner', 'New to the gym'], ['intermediate', 'Training 6+ months']]
export const DAY_OPTIONS = [3, 4, 5]

// slot -> [beginner exercise id, intermediate exercise id, role]. 'c' = compound, 'a' = accessory.
// Beginners get machine/dumbbell versions that are easier to learn and to load safely.
const SLOT = {
  squat:    ['1760', '0043', 'c'],  // dumbbell goblet squat | barbell full squat
  hinge:    ['1459', '0085', 'c'],  // dumbbell | barbell romanian deadlift
  legpress: ['0739', '0739', 'c'],  // sled 45° leg press
  lunge:    ['0431', '0336', 'c'],  // dumbbell step-up | dumbbell lunge
  split:    ['0410', '0410', 'a'],  // dumbbell single leg split squat
  legext:   ['0585', '0585', 'a'],  // lever leg extension
  legcurl:  ['0599', '0599', 'a'],  // lever seated leg curl
  calf:     ['0605', '0605', 'a'],  // lever standing calf raise
  bench:    ['0289', '0025', 'c'],  // dumbbell | barbell bench press
  incline:  ['0314', '0314', 'c'],  // dumbbell incline bench press
  ohp:      ['0405', '0426', 'c'],  // dumbbell seated | standing overhead press
  fly:      ['0227', '0227', 'a'],  // cable standing fly
  lateral:  ['0334', '0334', 'a'],  // dumbbell lateral raise
  vpull:    ['2330', '2330', 'c'],  // cable lat pulldown
  row:      ['1350', '0027', 'c'],  // lever seated row | barbell bent over row
  row2:     ['0861', '0293', 'c'],  // cable seated row | dumbbell bent over row
  curl:     ['0294', '0031', 'a'],  // dumbbell | barbell curl
  hammer:   ['0313', '0313', 'a'],  // dumbbell hammer curl
  triceps:  ['0241', '0241', 'a'],  // cable triceps pushdown
  core:     ['0276', '0472', 'a'],  // dead bug | hanging leg raise
  glute:    ['1409', '1409', 'c'],  // barbell glute bridge
  abduct:   ['0597', '0597', 'a'],  // lever seated hip abduction
  kickback: ['0860', '0860', 'a']   // cable kickback
}

// Day templates. `f` lists the extra glute slots the female variant appends.
const DAYS = {
  fullA:  { name: 'Full Body A', emoji: 'figureStrength', s: ['squat', 'bench', 'vpull', 'legcurl', 'lateral', 'core'], f: ['glute', 'abduct'] },
  fullB:  { name: 'Full Body B', emoji: 'dumbbell', s: ['hinge', 'ohp', 'row', 'lunge', 'curl', 'triceps'], f: ['abduct'] },
  fullC:  { name: 'Full Body C', emoji: 'machine', s: ['legpress', 'incline', 'row2', 'split', 'fly', 'core'], f: ['glute', 'kickback'] },
  upperA: { name: 'Upper A', emoji: 'arm', s: ['bench', 'row', 'ohp', 'vpull', 'curl', 'triceps'], f: [] },
  lowerA: { name: 'Lower A', emoji: 'legs', s: ['squat', 'hinge', 'legext', 'legcurl', 'calf', 'core'], f: ['glute', 'abduct'] },
  upperB: { name: 'Upper B', emoji: 'pullup', s: ['incline', 'vpull', 'row2', 'lateral', 'hammer', 'fly'], f: [] },
  lowerB: { name: 'Lower B', emoji: 'legs', s: ['legpress', 'hinge', 'lunge', 'legcurl', 'calf', 'core'], f: ['glute', 'kickback'] },
  push:   { name: 'Push', emoji: 'barbell', s: ['bench', 'incline', 'ohp', 'lateral', 'fly', 'triceps'], f: [] },
  pull:   { name: 'Pull', emoji: 'pullup', s: ['vpull', 'row', 'row2', 'curl', 'hammer', 'core'], f: [] },
  legs:   { name: 'Legs', emoji: 'legs', s: ['squat', 'hinge', 'lunge', 'legext', 'legcurl', 'calf'], f: ['glute', 'abduct'] }
}

// days/week -> [template, weekday] (0 = Sunday), plus the weekdays left for cardio.
const SPLITS = {
  3: { days: [['fullA', 1], ['fullB', 3], ['fullC', 5]], cardio: [2, 4] },
  4: { days: [['upperA', 1], ['lowerA', 2], ['upperB', 4], ['lowerB', 5]], cardio: [6] },
  5: { days: [['upperA', 1], ['lowerA', 2], ['push', 3], ['pull', 5], ['legs', 6]], cardio: [] }
}

// Reps per role, sets per role by level, and cardio per goal.
//  - muscle: 3+ sets on everything so each major muscle reaches ~10 sets/week (ACSM 2026:
//    hypertrophy is enhanced by >=10 sets/wk).
//  - cardio: `week` = target minutes of moderate cardio per week. 150 is the WHO minimum for
//    every adult; fat loss aims higher (ACSM 2009: 150–250 min/wk gives modest loss, more gives
//    more). Lifting and cardio in the same week do not blunt muscle growth (Schumann 2022).
//    `day` = minutes on a dedicated cardio day; `allDays` = use every free weekday for it.
const RX = {
  muscle:  { reps: { c: [10, 8], a: [12, 12] }, sets: { c: [3, 4], a: [3, 3] }, week: 90, day: 30, allDays: false },
  fatloss: { reps: { c: [12, 10], a: [15, 15] }, sets: { c: [3, 3], a: [2, 3] }, week: 180, day: 40, allDays: true },
  tone:    { reps: { c: [12, 12], a: [15, 15] }, sets: { c: [3, 3], a: [2, 3] }, week: 150, day: 30, allDays: true }
}
const INCLINE_WALK = '3666'
const BIKE = '0798'

export function buildPlan({ sex, goal, level, days }) {
  const rx = RX[goal] || RX.muscle
  const li = level === 'intermediate' ? 1 : 0
  const split = SPLITS[days] || SPLITS[3]
  const entry = slot => {
    const [b, i, role] = SLOT[slot]
    return { id: li ? i : b, sets: rx.sets[role][li], reps: rx.reps[role][li], weight: 0 }
  }
  const routines = [], week = {}
  const cdays = rx.allDays ? split.cardio : split.cardio.slice(0, 1)
  // What the dedicated cardio days don't cover is spread over the gym days as a finisher,
  // 10–30 min each (rounded to 5).
  const left = rx.week - cdays.length * rx.day
  const finisher = left > 0 ? Math.min(30, Math.max(10, Math.ceil(left / split.days.length / 5) * 5)) : 0
  for (const [key, wd] of split.days) {
    const d = DAYS[key]
    const slots = sex === 'female' ? [...d.s, ...d.f] : d.s
    const ex = slots.map(entry)
    if (finisher) ex.push({ id: INCLINE_WALK, sets: 1, min: finisher, speed: 5 })
    const r = { id: uid(), name: d.name, emoji: d.emoji, ex, smart: true }
    routines.push(r); week[wd] = r.id
  }
  if (cdays.length) {
    const r = {
      id: uid(), name: 'Cardio + Core', emoji: 'figureRun', smart: true,
      ex: [{ id: BIKE, sets: 1, min: rx.day, speed: 18 }, { ...entry('core'), sets: 3 }]
    }
    routines.push(r)
    cdays.forEach(wd => { week[wd] = r.id })
  }
  return { routines, week }
}

// Minutes of planned cardio per week.
export const cardioMinutes = plan =>
  Object.values(plan.week).reduce((n, id) => n + plan.routines.find(r => r.id === id).ex.reduce((m, e) => m + (e.min || 0), 0), 0)

// How to progress — shown with the plan. Double progression (ACSM 2009: add 2–10% load once
// you beat the target by 1–2 reps) and training close to failure (Robinson et al. 2024).
export const PROGRESSION = [
  'Pick a weight where the last 1–3 reps of each set are hard but clean.',
  'When you beat the target reps on every set, add a little weight (2–5%) next time.',
  'Aim for 7,000–10,000 steps a day on top of the plan — walking burns more than most people think.',
  'Rest 2–3 min after big lifts (squats, presses, rows) and 1–2 min after small ones.'
]

// Hard sets per week that each muscle-group slot gets — used by the self-check test to keep
// every plan inside the evidence-based range.
export function weeklySets(plan) {
  const byId = {}
  plan.routines.forEach(r => {
    const times = Object.values(plan.week).filter(id => id === r.id).length
    r.ex.forEach(e => { if (e.reps) byId[e.id] = (byId[e.id] || 0) + e.sets * times })
  })
  return byId
}
