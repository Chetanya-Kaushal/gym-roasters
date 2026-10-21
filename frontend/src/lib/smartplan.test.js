import { describe, it, expect } from 'vitest'
import { buildPlan, weeklySets, cardioMinutes, GOALS, DAY_OPTIONS } from './smartplan.js'
import { targetsOf, bmiOf, bmiClass, dayTotals, FOODS } from './nutrition.js'
import { EXIDX } from './exercises.js'

describe('buildPlan', () => {
  for (const sex of ['male', 'female']) for (const [goal] of GOALS) for (const level of ['beginner', 'intermediate']) for (const days of DAY_OPTIONS) {
    it(`${sex}/${goal}/${level}/${days}d`, () => {
      const plan = buildPlan({ sex, goal, level, days })
      // every exercise exists in the library
      plan.routines.forEach(r => r.ex.forEach(e => expect(EXIDX[e.id], e.id).toBeTruthy()))
      // the requested number of gym days, every scheduled id resolves
      const gym = Object.values(plan.week).filter(id => plan.routines.find(r => r.id === id).name !== 'Cardio + Core')
      expect(gym.length).toBe(days)
      // chest and back each get a meaningful weekly dose
      const ws = weeklySets(plan)
      const total = ids => ids.reduce((n, id) => n + (ws[id] || 0), 0)
      expect(total(['0289', '0025', '0314', '0227'])).toBeGreaterThanOrEqual(5)
      expect(total(['2330', '1350', '0027', '0861', '0293'])).toBeGreaterThanOrEqual(6)
      // muscle goal: chest and back at or near the >=10 sets/week hypertrophy threshold
      if (goal === 'muscle') {
        expect(total(['0289', '0025', '0314', '0227'])).toBeGreaterThanOrEqual(9)
        expect(total(['2330', '1350', '0027', '0861', '0293'])).toBeGreaterThanOrEqual(9)
      }
      // cardio: WHO 150 min/week minimum for fat loss and toning, some cardio for muscle too
      expect(cardioMinutes(plan)).toBeGreaterThanOrEqual(goal === 'muscle' ? 60 : 150)
    })
  }
  it('female variant adds glute work, male does not', () => {
    const f = buildPlan({ sex: 'female', goal: 'muscle', level: 'beginner', days: 3 })
    const m = buildPlan({ sex: 'male', goal: 'muscle', level: 'beginner', days: 3 })
    expect(weeklySets(f)['1409']).toBeGreaterThan(0)
    expect(weeklySets(m)['1409']).toBeUndefined()
  })
})

describe('nutrition', () => {
  const base = { sex: 'male', age: 30, heightCm: 175, activity: 'moderate' }
  it('Mifflin-St Jeor + deficit for fat loss', () => {
    const t = targetsOf({ ...base, goal: 'fatloss' }, 80)
    // BMR = 800 + 1093.75 - 150 + 5 = 1748.75; TDEE = 2710.6
    expect(t.bmr).toBe(1749)
    expect(t.tdee).toBe(2711)
    expect(t.kcal).toBe(2210)
    expect(t.protein).toBe(Math.round(25 * 1.75 ** 2 * 2.0))   // BMI 26.1 -> reference weight
  })
  it('never cuts calories for an underweight BMI', () => {
    const t = targetsOf({ ...base, goal: 'fatloss' }, 55)
    expect(t.cls.key).toBe('under')
    expect(t.kcal).toBe(Math.round(t.tdee / 10) * 10)
  })
  it('keeps the calorie floor', () => {
    const t = targetsOf({ sex: 'female', age: 60, heightCm: 150, activity: 'sedentary', goal: 'fatloss' }, 50)
    expect(t.kcal).toBe(1200)
  })
  it('caps the deficit at 20% of maintenance for smaller people', () => {
    const t = targetsOf({ sex: 'female', age: 25, heightCm: 158, activity: 'light', goal: 'fatloss' }, 60)
    expect(t.tdee - t.kcal).toBeLessThanOrEqual(Math.round(t.tdee * 0.2) + 10)
  })
  it('water target is the drinks share, plus 500 ml on gym days', () => {
    const t = targetsOf({ ...base, goal: 'muscle' }, 70)
    expect(t.water).toBe(2000)
  })
  it('BMI classes', () => {
    expect(bmiClass(bmiOf(70, 175)).key).toBe('normal')
    expect(bmiClass(30).key).toBe('obese')
  })
  it('day totals respect quantity', () => {
    const egg = FOODS.find(f => f.id === 'egg')
    expect(dayTotals([{ ...egg, q: 3 }]).p).toBe(19)
  })
})
