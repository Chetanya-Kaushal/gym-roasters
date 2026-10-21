import { describe, it, expect } from 'vitest'
import { PROGRAMS, buildProgram } from './programs.js'
import { warmupSets, platesFor } from './blocks.js'
import { EXIDX } from './exercises.js'

describe('programs', () => {
  for (const p of PROGRAMS) for (const level of ['beginner', 'intermediate']) {
    it(`${p.id}/${level}`, () => {
      const { routines, week } = buildProgram(p, level)
      routines.forEach(r => r.ex.forEach(e => expect(EXIDX[e.id], `${p.id} ${r.name} ${e.id}`).toBeTruthy()))
      // every training day starts with a warm-up, and every scheduled id resolves
      routines.forEach(r => expect(r.ex[0].wu, r.name).toBe(true))
      Object.values(week).forEach(id => expect(routines.some(r => r.id === id)).toBe(true))
      const gymDays = Object.values(week).filter(id => routines.find(r => r.id === id).ex.some(e => e.reps && !e.wu)).length
      expect(gymDays).toBeGreaterThanOrEqual(Math.min(p.days, 2))
    })
  }
  it('women programs exist', () => expect(PROGRAMS.filter(p => p.for === 'women').length).toBeGreaterThanOrEqual(3))
})

describe('blocks', () => {
  it('ramp-up sets below the working weight', () => {
    expect(warmupSets(100)).toEqual([{ w: 40, r: 8 }, { w: 60, r: 5 }, { w: 80, r: 3 }])
    expect(warmupSets(0)).toEqual([])
  })
  it('plate math', () => {
    expect(platesFor(100)).toEqual({ bar: 20, perSide: [25, 15], left: 0 })
    expect(platesFor(15)).toBe(null)
  })
})

describe('body-part builder', async () => {
  const { buildSession, PARTS, KIT } = await import('./builder.js')
  it('every part × kit gives a session with a warm-up and real exercises', () => {
    for (const [p] of PARTS) for (const [kit] of KIT) {
      const ex = buildSession({ parts: [p], kit, minutes: 45 })
      expect(ex[0].wu, p + kit).toBe(true)
      expect(ex.filter(e => !e.wu && e.reps).length, p + kit).toBeGreaterThanOrEqual(2)
      ex.forEach(e => expect(EXIDX[e.id], e.id).toBeTruthy())
    }
  })
})
