import { describe, it, expect } from 'vitest'
import { workoutBurn, dayActivity, awardsOf, closed } from './activity.js'
import { todayISO } from './format.js'

const base = () => ({ unit: 'kg', bodyweight: [{ d: '2026-01-01', w: 70 }], workouts: [], routines: [], week: {}, dayPlan: {}, profile: { sex: 'male', age: 30, heightCm: 175, activity: 'light', goal: 'fatloss' }, food: {}, water: {}, steps: {} })

describe('activity', () => {
  it('a 60-minute lifting session at 70 kg burns ~245 kcal (3.5 MET)', () => {
    const b = workoutBurn({ start: 1, end: 3600001, entries: [] }, 70)
    expect(b).toEqual({ minutes: 60, kcal: 245 })
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

describe('apple-style extras', async () => {
  const { trainingLoad, trends, streak, activityBurn, monthlyChallenge } = await import('./activity.js')
  const { lastDays } = await import('./activity.js')
  it('quick-logged activities count toward rings', () => {
    const S = base(), d = todayISO()
    S.activities = [{ d, type: 'run', min: 30, effort: 5 }]
    const a = dayActivity(S, d)
    expect(a.exercise.v).toBe(30)
    expect(a.move.v).toBe(activityBurn({ type: 'run', min: 30, effort: 5 }, 70))
  })
  it('a paused day does not break a streak', () => {
    const S = base(), days = lastDays(3)
    S.steps = { [days[0]]: 20000, [days[2]]: 20000 }
    S.ringPause = [{ from: days[1], to: days[1] }]
    expect(streak(S, x => x.move.p >= 1)).toBe(2)
  })
  it('training load ratio and trends readiness', () => {
    const S = base()
    S.activities = lastDays(28).map(d => ({ d, type: 'walk', min: 30, effort: 5 }))
    expect(trainingLoad(S).status).toBe('steady')
    expect(trends(S).find(t => t.key === 'Exercise').ready).toBe(true)
    expect(monthlyChallenge(S).goal).toBe(20)
  })
})
