// Program library — ready-made multi-week plans, in the spirit of the program catalogues in
// Nike Training Club, JEFIT, Hevy and Sweat, built on the same evidence as the smart plan
// (see smartplan.js): ~10+ hard sets per muscle per week for muscle (ACSM 2026), each muscle
// at least twice a week, 150+ min of cardio for fat loss (WHO, ACSM 2009), progressive overload.
//
// Every training day starts with a warm-up (blocks.js). Entries reference library exercises
// (all with animated demos). `level` picks the beginner/intermediate exercise for slot entries.
import { uid } from './format.js'
import { SLOT } from './smartplan.js'
import { warmupFor, CARDIO, INCLINE_WALK, BIKE, ELLIPTICAL } from './blocks.js'

// s(slot, sets, reps)  — slot from smartplan.SLOT; x(id, sets, reps) — a direct exercise id.
const s = (slot, sets, reps, extra) => ({ slot, sets, reps, ...extra })
const x = (id, sets, reps, extra) => ({ id, sets, reps, weight: 0, ...extra })
const hold = (id, sets, sec) => ({ id, mode: 'time', sets, sec, weight: 0 })
const day = (name, emoji, focus, wd, ex, cardio = []) => ({ name, emoji, focus, wd, ex, cardio })
const cardioDay = (name, wd, entries) => ({ name, emoji: 'figureRun', focus: 'cardio', wd, ex: entries, cardio: [] })

export const PROGRAMS = [
  {
    id: 'recomp', name: 'Fat Loss + Lean Muscle', tag: 'Recomposition', goals: ['fatloss', 'tone'], for: 'all', level: 'beginner', equip: 'gym', days: 4, weeks: 12,
    about: 'Lose fat while building muscle: upper/lower strength 4 days a week, two Zone 2 sessions and one interval session. Pair with a moderate calorie deficit and high protein.',
    plan: [
      day('Upper A', 'arm', 'upper', 1, [s('bench', 3, 10), s('row', 3, 10), s('ohp', 3, 10), s('vpull', 3, 12), s('curl', 2, 12), s('triceps', 2, 12)], CARDIO.finisher(15)),
      day('Lower A', 'legs', 'lower', 2, [s('squat', 3, 10), s('hinge', 3, 10), s('lunge', 2, 12), s('legcurl', 2, 12), s('calf', 2, 15), s('core', 3, 12)], CARDIO.finisher(15)),
      cardioDay('Zone 2 Cardio', 3, CARDIO.zone2(40)),
      day('Upper B', 'pullup', 'upper', 4, [s('incline', 3, 10), s('vpull', 3, 10), s('row2', 3, 12), s('lateral', 3, 15), s('hammer', 2, 12), s('fly', 2, 15)], CARDIO.finisher(15)),
      day('Lower B', 'legs', 'lower', 5, [s('legpress', 3, 12), s('hinge', 3, 10), s('split', 2, 12), s('legext', 2, 15), s('glute', 3, 12), s('core', 3, 12)], CARDIO.finisher(15)),
      cardioDay('Intervals', 6, CARDIO.intervals(8, 30)),
      cardioDay('Zone 2 Cardio', 0, CARDIO.zone2(40, BIKE))
    ]
  },
  {
    id: 'lean', name: 'Lean Muscle Builder', tag: 'Hypertrophy', goals: ['muscle'], for: 'all', level: 'intermediate', equip: 'gym', days: 5, weeks: 12,
    about: 'Upper/lower plus push/pull/legs: 12–18 hard sets per muscle per week in the 6–12 rep range, with short easy cardio for heart health. Eat a small surplus (~250 kcal).',
    plan: [
      day('Upper Power', 'arm', 'upper', 1, [s('bench', 4, 6), s('row', 4, 6), s('ohp', 3, 8), s('vpull', 3, 8), s('curl', 2, 10), s('triceps', 2, 10)]),
      day('Lower Power', 'legs', 'lower', 2, [s('squat', 4, 6), s('hinge', 3, 8), s('legpress', 3, 10), s('legcurl', 3, 10), s('calf', 3, 12)], CARDIO.finisher(10, BIKE)),
      day('Push', 'barbell', 'upper', 4, [s('incline', 4, 10), s('bench', 3, 10), s('ohp', 3, 10), s('lateral', 4, 15), s('fly', 3, 12), s('triceps', 3, 12)]),
      day('Pull', 'pullup', 'upper', 5, [s('vpull', 4, 10), s('row2', 3, 10), s('row', 3, 10), x('0378', 3, 15), s('curl', 3, 12), s('hammer', 2, 12)]),
      day('Legs', 'legs', 'lower', 6, [s('squat', 3, 10), s('hinge', 3, 10), s('split', 3, 12), s('legext', 3, 15), s('legcurl', 3, 12), s('calf', 3, 15)], CARDIO.finisher(10, BIKE))
    ]
  },
  {
    id: 'ppl6', name: 'Push Pull Legs ×2', tag: 'Bodybuilding', goals: ['muscle'], for: 'all', level: 'intermediate', equip: 'gym', days: 6, weeks: 8,
    about: 'The classic six-day split: every muscle twice a week with high volume. For lifters with 6+ months of training and time to recover.',
    plan: [
      day('Push A', 'barbell', 'upper', 1, [s('bench', 4, 8), s('ohp', 3, 8), s('incline', 3, 10), s('lateral', 3, 15), s('triceps', 3, 12)]),
      day('Pull A', 'pullup', 'upper', 2, [s('vpull', 4, 8), s('row', 3, 8), s('row2', 3, 10), x('0378', 3, 15), s('curl', 3, 10)]),
      day('Legs A', 'legs', 'lower', 3, [s('squat', 4, 8), s('hinge', 3, 10), s('legext', 3, 12), s('legcurl', 3, 12), s('calf', 4, 12)]),
      day('Push B', 'barbell', 'upper', 4, [s('incline', 4, 10), s('bench', 3, 10), x('0603', 3, 10), s('lateral', 4, 15), s('fly', 3, 15), s('triceps', 3, 12)]),
      day('Pull B', 'pullup', 'upper', 5, [s('row', 4, 10), s('vpull', 3, 12), s('row2', 3, 12), x('0378', 3, 15), s('hammer', 3, 12)]),
      day('Legs B', 'legs', 'lower', 6, [s('legpress', 4, 12), s('hinge', 3, 10), s('split', 3, 12), s('legcurl', 3, 12), s('calf', 4, 15), s('core', 3, 12)])
    ]
  },
  {
    id: 'strength', name: 'Strength Foundations 5×5', tag: 'Strength', goals: ['muscle', 'tone'], for: 'all', level: 'beginner', equip: 'gym', days: 3, weeks: 12,
    about: 'Alternate workouts A and B three times a week with five heavy sets of five on the big barbell lifts — the simple linear-progression format beginners gain strength fastest on.',
    plan: [
      day('Workout A', 'barbell', 'full', 1, [x('0043', 5, 5), x('0025', 5, 5), x('0027', 5, 5), s('core', 3, 12)]),
      day('Workout B', 'barbell', 'full', 3, [x('0043', 5, 5), x('0426', 5, 5), x('0032', 1, 5), s('core', 3, 12)]),
      day('Workout A', 'barbell', 'full', 5, [x('0043', 5, 5), x('0025', 5, 5), x('0027', 5, 5), s('core', 3, 12)])
    ]
  },
  {
    id: 'starter', name: 'Gym Starter', tag: 'First 8 weeks', goals: ['tone', 'fatloss', 'muscle'], for: 'all', level: 'beginner', equip: 'gym', days: 3, weeks: 8,
    about: 'Machines and dumbbells only, two moderate sets per exercise, full body three days a week. Learn the movements safely before adding volume.',
    plan: [
      day('Full Body A', 'machine', 'full', 1, [x('0739', 2, 12), x('0577', 2, 12), x('2330', 2, 12), x('0599', 2, 12), x('0603', 2, 12), x('0276', 2, 10)], CARDIO.finisher(10)),
      day('Full Body B', 'machine', 'full', 3, [x('1760', 2, 12), x('1350', 2, 12), x('0289', 2, 12), x('0585', 2, 12), x('0334', 2, 15), x('0274', 2, 15)], CARDIO.finisher(10)),
      day('Full Body C', 'machine', 'full', 5, [x('0739', 2, 12), x('0861', 2, 12), x('0314', 2, 12), x('0586', 2, 12), x('0294', 2, 12), x('0241', 2, 12)], CARDIO.finisher(10))
    ]
  },
  {
    id: 'glutes', name: 'Glutes & Legs Sculpt', tag: 'Women · Lower body', goals: ['tone', 'muscle'], for: 'women', level: 'beginner', equip: 'gym', days: 4, weeks: 10,
    about: 'Two glute-and-leg days with hip bridges, split squats, RDLs and abduction, one upper-body day and one full-body day with cardio. Builds shape and strength — fat loss still comes from the overall diet, not spot training.',
    plan: [
      day('Glutes & Hamstrings', 'legs', 'lower', 1, [x('1409', 4, 10), x('1459', 3, 10), x('0410', 3, 10), x('0599', 3, 12), x('0597', 3, 15), x('0860', 2, 15)]),
      day('Upper Body', 'arm', 'upper', 2, [x('0289', 3, 10), x('2330', 3, 10), x('0405', 3, 10), x('1350', 3, 12), x('0334', 2, 15), x('0241', 2, 12)], CARDIO.finisher(15)),
      day('Glutes & Quads', 'legs', 'lower', 4, [x('0739', 3, 12), x('1409', 3, 12), x('0431', 3, 10), x('3769', 3, 12), x('0585', 2, 15), x('0597', 3, 15)]),
      day('Full Body + Cardio', 'figureStrength', 'full', 5, [x('1760', 3, 12), x('0293', 3, 12), x('0314', 3, 10), x('1459', 3, 10), x('0276', 3, 10)], CARDIO.zone2(20)),
      cardioDay('Zone 2 Cardio', 6, CARDIO.zone2(35))
    ]
  },
  {
    id: 'toned', name: 'Strong & Toned', tag: 'Women · Full body', goals: ['tone', 'fatloss'], for: 'women', level: 'beginner', equip: 'gym', days: 3, weeks: 8,
    about: 'Three full-body strength days with supersets and a short finisher, plus two cardio days — the strength-plus-cardio mix that best changes body composition.',
    plan: [
      day('Full Body A', 'figureStrength', 'full', 1, [x('1760', 3, 12), x('0289', 3, 10), x('2330', 3, 12), x('1409', 3, 12), x('0334', 2, 15), x('0276', 3, 10)], CARDIO.finisher(15)),
      cardioDay('Zone 2 Cardio', 2, CARDIO.zone2(35, ELLIPTICAL)),
      day('Full Body B', 'dumbbell', 'full', 3, [x('1459', 3, 10), x('0405', 3, 10), x('0293', 3, 12), x('0336', 2, 12), x('0597', 3, 15), x('0274', 3, 15)], CARDIO.finisher(15)),
      cardioDay('Intervals', 4, CARDIO.intervals(6, 30)),
      day('Full Body C', 'machine', 'full', 5, [x('0739', 3, 12), x('0314', 3, 10), x('0861', 3, 12), x('0599', 3, 12), x('0860', 2, 15), x('0472', 3, 10)], CARDIO.finisher(15))
    ]
  },
  {
    id: 'homedb', name: 'Home Dumbbell Sculpt', tag: 'Women · At home', goals: ['tone', 'fatloss', 'muscle'], for: 'women', level: 'beginner', equip: 'dumbbell', days: 3, weeks: 8,
    about: 'A pair of dumbbells and a mat. Full-body sessions that hit every muscle twice a week, finished with a short bodyweight circuit.',
    plan: [
      day('Lower + Core', 'legs', 'lower', 1, [x('1760', 3, 12), x('1459', 3, 12), x('0336', 3, 10), x('3561', 3, 12), x('1379', 2, 15), x('0276', 3, 10)], CARDIO.bodyweightHiit(2)),
      day('Upper + Core', 'arm', 'upper', 3, [x('0289', 3, 12), x('0293', 3, 12), x('0405', 3, 10), x('0334', 3, 15), x('0294', 2, 12), x('0333', 2, 12)], CARDIO.bodyweightHiit(2)),
      day('Full Body', 'dumbbell', 'full', 5, [x('0431', 3, 10), x('0410', 3, 10), x('0662', 3, 10), x('0293', 3, 12), x('2137', 3, 10), x('0274', 3, 15)], CARDIO.bodyweightHiit(2))
    ]
  },
  {
    id: 'bodyweight', name: 'No-Equipment Home', tag: 'Bodyweight', goals: ['fatloss', 'tone'], for: 'all', level: 'beginner', equip: 'home', days: 3, weeks: 6,
    about: 'Nothing but your body weight: push-ups, lunges, inverted rows (under a sturdy table), core work and a HIIT circuit. Make it harder by slowing the reps down.',
    plan: [
      day('Full Body A', 'figureStrength', 'full', 1, [x('0662', 3, 10), x('1460', 3, 12), x('2300', 3, 10), x('3561', 3, 12), x('0276', 3, 10)], CARDIO.bodyweightHiit(3)),
      day('Full Body B', 'figureStrength', 'full', 3, [x('0279', 3, 8), x('3769', 3, 12), x('0499', 3, 8), x('0710', 3, 15), x('0274', 3, 15)], CARDIO.bodyweightHiit(3)),
      day('Full Body C', 'figureStrength', 'full', 5, [x('0283', 3, 8), x('0514', 3, 10), x('2300', 3, 10), x('1688', 3, 10), x('0472', 3, 8)], CARDIO.bodyweightHiit(3))
    ]
  },
  {
    id: 'fatburn', name: 'Fat Burn: Strength + HIIT', tag: 'Weight loss', goals: ['fatloss'], for: 'all', level: 'intermediate', equip: 'gym', days: 4, weeks: 8,
    about: 'Four strength days with a cardio finisher, two interval sessions and a long Zone 2 day: ~250 min of activity a week, the range linked with clinically meaningful weight loss.',
    plan: [
      day('Upper', 'arm', 'upper', 1, [s('bench', 3, 10), s('row', 3, 10), s('ohp', 3, 10), s('vpull', 3, 12), s('triceps', 2, 15)], CARDIO.finisher(20)),
      day('Lower', 'legs', 'lower', 2, [s('squat', 3, 10), s('hinge', 3, 10), s('lunge', 3, 12), s('legcurl', 2, 15), s('core', 3, 12)], CARDIO.finisher(20)),
      cardioDay('Intervals', 3, CARDIO.intervals(10, 30)),
      day('Upper', 'pullup', 'upper', 4, [s('incline', 3, 12), s('vpull', 3, 12), s('row2', 3, 12), s('lateral', 3, 15), s('curl', 2, 15)], CARDIO.finisher(20)),
      day('Lower', 'legs', 'lower', 5, [s('legpress', 3, 12), s('hinge', 3, 12), s('split', 3, 12), s('glute', 3, 12), s('core', 3, 12)], CARDIO.finisher(20)),
      cardioDay('Intervals', 6, CARDIO.intervals(8, 30)),
      cardioDay('Long Zone 2', 0, CARDIO.zone2(50))
    ]
  },
  {
    id: 'express', name: '30-Minute Express', tag: 'Busy schedule', goals: ['tone', 'fatloss', 'muscle'], for: 'all', level: 'beginner', equip: 'gym', days: 3, weeks: 8,
    about: 'Short on time: four big exercises a day, two hard sets each, done as supersets. Small doses done consistently still build strength.',
    plan: [
      day('Express A', 'timer', 'full', 1, [s('squat', 2, 10, { sg: 'a' }), s('bench', 2, 10, { sg: 'a' }), s('hinge', 2, 10, { sg: 'b' }), s('vpull', 2, 10, { sg: 'b' })]),
      day('Express B', 'timer', 'full', 3, [s('legpress', 2, 12, { sg: 'a' }), s('ohp', 2, 10, { sg: 'a' }), s('lunge', 2, 10, { sg: 'b' }), s('row', 2, 10, { sg: 'b' })]),
      day('Express C', 'timer', 'full', 5, [s('hinge', 2, 10, { sg: 'a' }), s('incline', 2, 10, { sg: 'a' }), s('split', 2, 10, { sg: 'b' }), s('row2', 2, 12, { sg: 'b' })])
    ]
  },
  {
    id: 'gentle', name: 'Joint-Friendly Strength', tag: '50+ · Low impact', goals: ['tone', 'muscle'], for: 'all', level: 'beginner', equip: 'gym', days: 2, weeks: 12,
    about: 'Two machine-based sessions a week — the WHO minimum for muscle strength — plus low-impact cardio. Move slowly and stay a couple of reps short of failure. Check with your doctor first if you have a condition.',
    plan: [
      day('Strength A', 'machine', 'full', 2, [x('0739', 2, 12), x('0577', 2, 12), x('1350', 2, 12), x('0599', 2, 12), x('0597', 2, 15)], CARDIO.zone2(15, ELLIPTICAL)),
      cardioDay('Easy Walk', 4, CARDIO.zone2(30, INCLINE_WALK)),
      day('Strength B', 'machine', 'full', 5, [x('0585', 2, 12), x('2330', 2, 12), x('0603', 2, 12), x('0586', 2, 12), x('0276', 2, 8)], CARDIO.zone2(15, BIKE))
    ]
  },
  {
    id: 'cardio', name: 'Cardio & Heart Health', tag: 'Endurance', goals: ['fatloss', 'tone'], for: 'all', level: 'beginner', equip: 'gym', days: 2, weeks: 8,
    about: 'Mostly Zone 2 with one interval day and two short strength sessions: builds the aerobic base that lowers resting heart rate and blood pressure.',
    plan: [
      cardioDay('Zone 2', 1, CARDIO.zone2(40)),
      day('Strength', 'figureStrength', 'full', 2, [s('squat', 2, 12), s('bench', 2, 12), s('vpull', 2, 12), s('hinge', 2, 12)]),
      cardioDay('Intervals', 3, CARDIO.intervals(6, 30)),
      cardioDay('Zone 2', 4, CARDIO.zone2(40, BIKE)),
      day('Strength', 'figureStrength', 'full', 5, [s('legpress', 2, 12), s('incline', 2, 12), s('row', 2, 12), s('core', 2, 12)]),
      cardioDay('Long Zone 2', 6, CARDIO.zone2(60, ELLIPTICAL))
    ]
  }
]

// Concrete routines + weekly schedule for a program at a level.
export function buildProgram(p, level = p.level) {
  const li = level === 'intermediate' ? 1 : 0
  const routines = [], week = {}
  const byName = {}
  for (const d of p.plan) {
    // identical days (5×5 "Workout A" twice) share one routine
    const key = d.name + '|' + d.focus
    if (!byName[key]) {
      const main = d.ex.map(e => {
        const { slot, ...rest } = e
        const id = slot ? SLOT[slot][li] : e.id
        return { weight: 0, ...rest, id }
      })
      // supersets: map the spec's short tags to unique ids
      const sg = {}
      main.forEach(e => { if (e.sg) e.sg = sg[e.sg] ||= 'sg' + uid() })
      const ex = [...(d.focus === 'cardio' ? warmupFor('cardio') : warmupFor(d.focus)), ...main, ...d.cardio]
      const r = { id: uid(), name: d.name, emoji: d.emoji, ex, smart: true, prog: 'double', program: p.id }
      routines.push(r); byName[key] = r
    }
    week[d.wd] = byName[key].id
  }
  return { routines, week }
}

export const programFilters = {
  goal: [['all', 'All goals'], ['fatloss', 'Lose weight'], ['muscle', 'Build muscle'], ['tone', 'Tone & fitness']],
  who: [['all', 'Everyone'], ['women', 'For women']],
  equip: [['all', 'Any place'], ['gym', 'Gym'], ['dumbbell', 'Dumbbells'], ['home', 'No equipment']]
}
