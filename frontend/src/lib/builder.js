// Body-part workout builder (Fitbod-style "train what you want today"): pick muscles, kit and
// time, get a session with a warm-up, exercises in a sensible order (big compound lifts first)
// and an optional cardio finisher. Lists are ordered best-first within each body part.
import { EXIDX } from './exercises.js'
import { warmupFor, CARDIO } from './blocks.js'

export const PARTS = [
  ['chest', 'Chest'], ['back', 'Back'], ['shoulders', 'Shoulders'], ['arms', 'Arms'],
  ['legs', 'Legs'], ['glutes', 'Glutes'], ['abs', 'Abs & core'], ['full', 'Full body']
]
export const KIT = [['gym', 'Full gym'], ['dumbbell', 'Dumbbells'], ['home', 'No equipment']]
export const MINUTES = [20, 30, 45, 60]

// [id, compound?] best-first per part
const POOL = {
  chest: [['0025', 1], ['0289', 1], ['0314', 1], ['0577', 1], ['0662', 1], ['0279', 1], ['0308', 0], ['0227', 0], ['0283', 0]],
  back: [['2330', 1], ['0652', 1], ['0027', 1], ['1350', 1], ['0293', 1], ['0861', 1], ['0499', 1], ['2300', 1], ['0189', 0], ['0378', 0]],
  shoulders: [['0426', 1], ['0405', 1], ['0603', 1], ['2137', 1], ['0334', 0], ['0178', 0], ['0378', 0], ['0279', 1], ['0664', 0], ['3360', 0]],
  arms: [['0031', 0], ['0294', 0], ['0313', 0], ['0447', 0], ['0241', 0], ['0200', 0], ['0333', 0], ['0283', 0], ['0129', 0], ['1399', 0], ['1771', 0], ['1769', 0]],
  legs: [['0043', 1], ['1760', 1], ['0739', 1], ['0085', 1], ['1459', 1], ['0410', 1], ['0336', 1], ['1460', 1], ['3769', 1], ['0514', 1], ['0585', 0], ['0599', 0], ['0586', 0], ['0605', 0], ['1379', 0]],
  glutes: [['1409', 1], ['1459', 1], ['0410', 1], ['0431', 1], ['3769', 1], ['3561', 0], ['0860', 0], ['0597', 0], ['0710', 0]],
  abs: [['0472', 0], ['0276', 0], ['0274', 0], ['1688', 0], ['0630', 0], ['3544', 0]]
}
const KIT_OK = {
  gym: () => true,
  dumbbell: eq => eq === 'dumbbell' || eq === 'body weight',
  home: eq => eq === 'body weight'
}

export function buildSession({ parts, kit = 'gym', minutes = 45, level = 'beginner' }) {
  const want = parts.includes('full') ? ['legs', 'chest', 'back', 'shoulders', 'glutes', 'abs'] : parts
  // ~7 min per exercise incl. rest; the warm-up takes ~8 of the minutes
  const n = Math.max(3, Math.min(8, Math.round((minutes - 8) / 7)))
  const sets = level === 'intermediate' ? 4 : 3
  const lists = want.map(p => (POOL[p] || []).filter(([id]) => EXIDX[id] && KIT_OK[kit](EXIDX[id].eq)))
  const picked = []
  // round-robin across the chosen parts so each gets its share
  for (let i = 0; picked.length < n && i < 20; i++) {
    for (const l of lists) {
      const next = l.find(([id]) => !picked.some(p => p[0] === id))
      if (next && picked.length < n) picked.push(next)
    }
  }
  picked.sort((a, b) => b[1] - a[1])   // compound lifts first
  const upper = want.every(p => ['chest', 'back', 'shoulders', 'arms'].includes(p))
  const lower = want.every(p => ['legs', 'glutes'].includes(p))
  const ex = [
    ...warmupFor(upper ? 'upper' : lower ? 'lower' : 'full'),
    ...picked.map(([id, c]) => ({ id, sets: c ? sets : 3, reps: c ? (level === 'intermediate' ? 8 : 10) : 12, weight: 0, ...(EXIDX[id].eq === 'body weight' && !c ? { reps: 15 } : {}) }))
  ]
  if (minutes >= 45) ex.push(...(kit === 'home' ? CARDIO.bodyweightHiit(2) : CARDIO.finisher(10)))
  return ex
}
