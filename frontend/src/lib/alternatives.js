// Alternatives for an exercise — for when the machine is taken, the gym lacks the kit, or a
// movement doesn't agree with your joints. Two sources, in order:
//  1. Hand-picked movement-pattern groups (squat, hinge, press, row, …) covering every
//     exercise the smart plan uses, so its swaps train the same pattern, not just the muscle.
//  2. For everything else: library exercises with the same target muscle and body part,
//     common equipment first, near-duplicate variants ("v. 2", camera angles, stretches) left out.
import { EXDB, EXIDX } from './exercises.js'

const GROUPS = [
  ['1760', '0043', '0739', '0410', '0336', '0431', '1460'],   // squat / single-leg
  ['1459', '0085', '0032', '0549', '1409'],                   // hip hinge
  ['0289', '0025', '0314', '0577', '0662', '0308', '0227'],   // horizontal press / chest
  ['0405', '0426', '0603'],                                   // overhead press
  ['0334', '0178', '0378'],                                   // shoulder raises
  ['2330', '0652', '1326', '0017', '0198', '0673'],           // vertical pull
  ['1350', '0027', '0861', '0293', '0189'],                   // row
  ['0294', '0031', '0313', '0447'],                           // biceps
  ['0241', '0200', '0333'],                                   // triceps
  ['0599', '0586', '1459'],                                   // hamstrings
  ['0585', '1760', '0410'],                                   // quads (isolation)
  ['0605', '0594', '1379'],                                   // calves
  ['1409', '0860', '0597', '0431'],                           // glutes
  ['0276', '0472', '0274'],                                   // core
  ['3666', '0798', '2141', '2311', '0685', '2612']            // cardio
].map(g => g.filter(id => EXIDX[id]))

const COMMON = ['dumbbell', 'barbell', 'cable', 'leverage machine', 'body weight', 'smith machine', 'kettlebell', 'sled machine', 'ez barbell', 'band']
const VARIANT = /\((male|female)\)|\bv\. ?\d|pov|stretch|\(with arm blaster\)/i

export function alternativesOf(id, n = 6) {
  const ex = EXIDX[id]
  if (!ex) return []
  const out = []
  const add = e => { if (e && e.id !== id && !out.some(x => x.id === e.id)) out.push(e) }
  GROUPS.filter(g => g.includes(id)).forEach(g => g.forEach(x => add(EXIDX[x])))
  if (out.length < n) {
    const rank = e => (COMMON.indexOf(e.eq) + 1 || 99) + (e.eq === ex.eq ? 0.5 : 0)
    EXDB.filter(e => e.tg === ex.tg && e.bp === ex.bp && !VARIANT.test(e.n))
      .sort((a, b) => rank(a) - rank(b) || a.n.length - b.n.length)
      .forEach(add)
  }
  return out.slice(0, n)
}
