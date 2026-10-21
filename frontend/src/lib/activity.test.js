import { describe, it, expect } from 'vitest'
import { workoutBurn, dayActivity, awardsOf, closed } from './activity.js'
import { todayISO } from './format.js'

const base = () => ({ unit: 'kg', bodyweight: [{ d: '2026-01-01', w: 70 }], workouts: [], routines: [], week: {}, dayPlan: {}, profile: { sex: 'male', age: 30, heightCm: 175, activity: 'light', goal: 'fatloss' }, food: {}, water: {}, steps: {} })

describe('activity', () => {
  it('a 60-minute lifting session at 70 kg burns ~350 kcal (5 MET)', () => {
    const b = workoutBurn({ start: 1, end: 3600001, entries: [] }, 70)
    expect(b).toEqual({ minutes: 60, kcal: 350 })
  })
  it('cardio sets use their own MET', () => {
    const b = workoutBurn({ start: 1, end: 1200001, entries: [{ id: '0685', sets: [{ min: 20, speed: 10, done: true }] }] }, 70)
    expect(b.minutes).toBe(20)
    expect(b.kcal).toBe(Math.round(10 * 70 * 20 / 60))
  })
  it('rings close and awards unlock from logged data', () => {
    const S = base(), d = todayISO()
    S.workouts.push({ d, start: Date.now() - 3600000 * 1.5, end: Date.now(), entries: [], prs: ['0025'] })
    S.water[d] = 5000
    S.steps[d] = 10000
    const a = dayActivity(S, d)
    expect(closed(a)).toBe(true)
    const won = Object.fromEntries(awardsOf(S).map(x => [x.id, x.earned]))
    expect(won.first && won.pr && won.move && won.perfect && won.steps).toBe(true)
    expect(won.w10).toBe(false)
  })
})
