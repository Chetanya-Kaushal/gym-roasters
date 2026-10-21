// Muscle recovery (Fitbod-style): recent hard sets per muscle, faded over time. Muscle protein
// synthesis and soreness after a hard session mostly settle within 48–72 h, so fatigue decays
// with a ~30 h time constant: 10 sets just done → 0% ready, ~80% after 2 days, ~90% after 3.
import { loadOf, MUSCLE_NAME, MUSCLES } from './muscles.js'

export function recoveryOf(S, now = Date.now()) {
  const fatigue = {}
  for (const w of S.workouts || []) {
    const end = w.end || new Date(w.d + 'T18:00:00').getTime()
    const h = (now - end) / 3600000
    if (h < 0 || h > 24 * 6) continue
    const load = loadOf((w.entries || []).map(e => ({ id: e.id, sets: (e.sets || []).filter(s => s.done && !(s.min > 0)).length })))
    const k = Math.exp(-h / 30)
    for (const m in load) fatigue[m] = (fatigue[m] || 0) + load[m] * k
  }
  const ready = {}
  MUSCLES.forEach(m => { ready[m] = Math.round(Math.max(0, Math.min(100, 100 - (fatigue[m] || 0) * 10))) })
  const sore = MUSCLES.filter(m => ready[m] < 85).sort((a, b) => ready[a] - ready[b])
  return { fatigue, ready, sore, names: MUSCLE_NAME }
}
