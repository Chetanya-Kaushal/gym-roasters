// Building blocks shared by the smart plan, the program library and the body-part builder:
// warm-ups, cardio sessions and exercise entries.
//
// Warm-up: a general part (5 min easy cardio) then dynamic moves for the muscles the session
// trains — this combination improves performance and is the format recommended in reviews of
// warm-up research (e.g. Fradkin et al. 2010; McGowan et al. 2015). Ramp-up sets on the first
// heavy lift are shown in the workout itself (see warmupSets).
//
// Cardio: two kinds, both in the ACSM/WHO guidance —
//  - Zone 2 / steady: easy enough to hold a conversation (RPE 3–4/10), builds the aerobic base.
//  - Intervals: short hard efforts (RPE 8–9/10) with easy recovery; similar fitness gains in
//    less time (Milanović et al. 2015 meta-analysis).
// Entries carry `note` (shown in the workout) and `rest` (seconds, overrides the global timer).

export const BIKE = '0798', INCLINE_WALK = '3666', ELLIPTICAL = '2141', STEPMILL = '2311', RUN = '0685', BIKE_FAST = '2138'

const t = (id, sec, note) => ({ id, mode: 'time', sets: 1, sec, weight: 0, prog: 'off', wu: true, rest: 10, ...(note ? { note } : {}) })
const easy = (id, min) => ({ id, sets: 1, min, speed: id === BIKE ? 15 : 5, prog: 'off', wu: true, note: 'Easy pace — warm, not tired' })

export const WARMUPS = {
  lower: () => [easy(BIKE, 5), t('3224', 45, 'Jumping jacks'), t('1604', 60, '30 s each side'), t('1460', 45), t('3561', 45), t('3636', 30)],
  upper: () => [easy(ELLIPTICAL, 5), t('3224', 45, 'Jumping jacks'), t('1471', 45), t('1604', 60, '30 s each side'), t('0630', 30), { id: '0662', sets: 1, reps: 8, weight: 0, prog: 'off', wu: true, rest: 30, note: 'Easy push-ups, from the knees if needed' }],
  full: () => [easy(BIKE, 5), t('3224', 45, 'Jumping jacks'), t('1471', 45), t('1604', 60, '30 s each side'), t('1460', 45), t('0630', 30)],
  cardio: () => [easy(BIKE, 5), t('3636', 30), t('3224', 30, 'Jumping jacks')]
}
export const warmupFor = focus => (WARMUPS[focus] || WARMUPS.full)()

// Cardio sessions, as routine entries.
export const CARDIO = {
  zone2: (min = 35, id = INCLINE_WALK) => [{ id, sets: 1, min, speed: id === BIKE ? 18 : 5.5, prog: 'off', note: 'Zone 2: steady, you can still talk in full sentences (RPE 3–4/10)' }],
  intervals: (rounds = 8, work = 30, id = BIKE_FAST) => [
    { id: BIKE, sets: 1, min: 5, speed: 15, prog: 'off', note: 'Easy warm-up' },
    { id, mode: 'time', sets: rounds, sec: work, weight: 0, prog: 'off', rest: work * 3, note: `All-out ${work} s (RPE 8–9/10), then ${work * 3} s very easy` },
    { id: BIKE, sets: 1, min: 5, speed: 14, prog: 'off', note: 'Easy cool-down' }
  ],
  finisher: (min, id = INCLINE_WALK) => [{ id, sets: 1, min, speed: 5, prog: 'off', note: 'Steady incline walk — breathing harder but able to talk' }],
  bodyweightHiit: (rounds = 3) => [
    { id: '1160', mode: 'time', sets: rounds, sec: 40, weight: 0, prog: 'off', rest: 20, note: 'Burpees: 40 s on, 20 s off' },
    { id: '0630', mode: 'time', sets: rounds, sec: 40, weight: 0, prog: 'off', rest: 20, note: 'Mountain climbers' },
    { id: '3361', mode: 'time', sets: rounds, sec: 40, weight: 0, prog: 'off', rest: 20, note: 'Skater hops — step instead of jumping to make it easier' },
    { id: '3224', mode: 'time', sets: rounds, sec: 40, weight: 0, prog: 'off', rest: 60, note: 'Jumping jacks' }
  ]
}

// Ramp-up sets before the first heavy set: ~40% × 8, 60% × 5, 80% × 3 of the working weight,
// rounded to the nearest 2.5 (kg) / 5 (lb). Empty when there is no working weight yet.
export function warmupSets(work, unit = 'kg') {
  if (!(work > 0)) return []
  const step = unit === 'lb' ? 5 : 2.5
  const bar = unit === 'lb' ? 45 : 20
  return [[0.4, 8], [0.6, 5], [0.8, 3]]
    .map(([p, r]) => ({ w: Math.max(bar, Math.round((work * p) / step) * step), r }))
    .filter((s, i, a) => s.w < work && (i === 0 || s.w > a[i - 1].w))
}

// Plates per side for a barbell load: greedy over standard plates.
export function platesFor(total, unit = 'kg', bar) {
  const b = bar ?? (unit === 'lb' ? 45 : 20)
  const plates = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
  let side = (total - b) / 2
  if (side < 0) return null
  const out = []
  for (const p of plates) while (side >= p - 1e-9) { out.push(p); side -= p }
  return { bar: b, perSide: out, left: Math.round(side * 2 * 100) / 100 }
}
