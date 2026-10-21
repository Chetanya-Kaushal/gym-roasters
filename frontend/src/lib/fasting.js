// Intermittent fasting protocols. Evidence: for weight loss, time-restricted eating works about
// as well as plain calorie restriction — it is a way to eat less, not extra fat burning
// (e.g. Lowe et al. 2020; Liu et al. 2022 NEJM). Not for pregnancy, diabetes on medication or
// a history of eating disorders.
export const PROTOCOLS = [
  ['12:12', 12, 'Gentle start'], ['14:10', 14, 'Easy daily rhythm'], ['16:8', 16, 'Most popular'],
  ['18:6', 18, 'Advanced'], ['20:4', 20, 'Warrior'], ['OMAD', 23, 'One meal a day']
]
export const STAGES = [
  [0, 'Digesting', 'Blood sugar rises and settles after your last meal.'],
  [4, 'Settling', 'Insulin falls back towards baseline.'],
  [12, 'Fat burning ramps up', 'Your body leans more on stored fat for fuel.'],
  [16, 'Deep fast', 'Ketone levels start to rise in many people.'],
  [20, 'Extended', 'Keep hydrated; break the fast gently.']
]
export const stageOf = h => [...STAGES].reverse().find(s => h >= s[0])
