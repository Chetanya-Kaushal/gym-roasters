// Nutrition targets and diet guidance. Every number comes from a published source:
//
//  - BMR: Mifflin-St Jeor — the most accurate of the common prediction equations in the
//    American Dietetic Association's evidence analysis (Frankenfield et al., 2005). Still an
//    estimate: expect ±10% for an individual.
//  - Activity multipliers: the conventional 1.2–1.725 scale (a convention, not a measurement).
//  - BMI classes: WHO. The 2004 WHO expert consultation also flags 23 / 27.5 as extra public
//    health action points for Asian populations — shown as a note, the classes stay WHO's.
//  - Deficit: 500 kcal/day (≈0.5 kg/week), capped at 20% of maintenance so smaller people lose
//    ~0.5–1% of body weight a week — slower loss keeps more muscle (Garthe 2011). BMI 30+:
//    up to 750 kcal / 25% (AHA/ACC/TOS 2013 obesity guideline: 500–750 kcal/day). Never below
//    1200 (women) / 1500 (men) kcal without medical supervision. Surplus for muscle: ~250 kcal.
//  - Protein: 1.4–2.0 g/kg/day for exercising people, more in a deficit to keep muscle
//    (ISSN position stand, 2017); gains plateau around 1.6 g/kg, upper bound ~2.2 (Morton 2018).
//  - Water: EFSA adequate intake, 2.5 L (men) / 2.0 L (women) total per day, ~20% of which comes
//    from food — so the drinks target the tracker counts is 2.0 / 1.6 L, plus 0.5 L on training days.
//  - Diet pattern: Mediterranean / DASH-style eating — the most consistently top-ranked
//    patterns, with the largest and longest trials behind them.

export const ACTIVITY = [
  ['sedentary', 'Mostly sitting (desk job)', 1.2],
  ['light', 'Lightly active (walks, 1–3 workouts/wk)', 1.375],
  ['moderate', 'Active (3–5 workouts/wk)', 1.55],
  ['very', 'Very active (physical job or 6+ workouts/wk)', 1.725]
]
export const DIETS = [
  ['veg', 'Vegetarian'], ['egg', 'Eggetarian'], ['nonveg', 'Non-vegetarian'], ['vegan', 'Vegan']
]

export const bmiOf = (kg, cm) => (kg > 0 && cm > 0 ? kg / ((cm / 100) ** 2) : null)

export function bmiClass(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return { key: 'under', label: 'Underweight', color: 'var(--blue)' }
  if (bmi < 25) return { key: 'normal', label: 'Healthy weight', color: 'var(--green)' }
  if (bmi < 30) return { key: 'over', label: 'Overweight', color: 'var(--orange)' }
  return { key: 'obese', label: 'Obesity', color: 'var(--red)' }
}

export const bmrOf = ({ sex, age, heightCm, weightKg }) =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'female' ? -161 : 5)

// Daily targets for a profile. Returns null until the body measurements are filled in.
// `goal` can be overridden by the BMI: a fat-loss deficit is never prescribed to someone
// underweight, and a surplus is not prescribed to someone already overweight.
export function targetsOf(p, weightKg) {
  const w = weightKg || p.weightKg
  if (!(w > 0 && p.heightCm > 0 && p.age > 0)) return null
  const bmi = bmiOf(w, p.heightCm)
  const cls = bmiClass(bmi)
  const bmr = bmrOf({ ...p, weightKg: w })
  const mult = (ACTIVITY.find(a => a[0] === p.activity) || ACTIVITY[1])[2]
  // p.tdee: the adaptive estimate from logged intake and weight trend (adaptive.js), once applied
  const tdee = p.tdee > 0 ? p.tdee : bmr * mult
  const notes = []
  let delta = 0
  if (p.goal === 'fatloss') {
    if (cls.key === 'under') { delta = 0; notes.push('Your BMI is below 18.5, so the plan does not cut calories. Eat at maintenance and focus on strength — talk to a doctor before trying to lose weight.') }
    else delta = -Math.round(cls.key === 'obese' ? Math.min(750, tdee * 0.25) : Math.min(500, tdee * 0.2))
  } else if (p.goal === 'muscle') {
    if (cls.key === 'over' || cls.key === 'obese') { delta = 0; notes.push('With a BMI of 25+, eating at maintenance with high protein builds muscle while you slowly lose fat ("recomposition") — no bulking needed.') }
    else delta = 250
  } else {
    delta = cls.key === 'under' ? 150 : bmi < 22 ? 0 : -300
  }
  const floor = p.sex === 'female' ? 1200 : 1500
  let kcal = Math.round((tdee + delta) / 10) * 10
  if (kcal < floor) { kcal = floor; notes.push(`Calories are kept at the safe minimum of ${floor} kcal. Going lower needs medical supervision.`) }
  if (p.age < 18) notes.push('Under 18: these adult formulas do not apply. Train with a coach or PE teacher and eat normally — no calorie counting.')
  if (p.age >= 65) notes.push('65+: add balance exercises 3 days a week (WHO) and check with a doctor before starting.')
  if (cls.key === 'obese') notes.push('With a BMI of 30+, a check-up with a doctor before starting is a good idea — they can tailor this further.')
  // Protein is scaled to a healthy reference weight (BMI 25) for higher BMIs, otherwise the
  // g/kg rule gives targets that are hard to eat and unnecessary.
  const protKg = cls.key === 'over' || cls.key === 'obese' ? 25 * (p.heightCm / 100) ** 2 : w
  const perKg = p.goal === 'fatloss' ? 2.0 : 1.8
  const protein = Math.round(protKg * perKg)
  const fat = Math.round((kcal * 0.28) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  const water = p.sex === 'female' ? 1600 : 2000   // from drinks; EFSA total 2.0 / 2.5 L
  return {
    bmi: Math.round(bmi * 10) / 10, cls, bmr: Math.round(bmr), tdee: Math.round(tdee),
    kcal, delta: kcal - Math.round(tdee), protein, fat, carbs, water, notes,
    weeklyKg: Math.round(((kcal - tdee) * 7) / 7700 * 10) / 10,
    asianNote: bmi >= 23 && bmi < 25
  }
}

// Water target for a given day: the EFSA drinks share plus half a litre on training days.
export const waterTargetOf = (t, trainingDay) => (t ? t.water : 1600) + (trainingDay ? 500 : 0)

// Meal split for the day (breakfast, lunch, snack, dinner).
const SPLIT = [['Breakfast', 0.25], ['Lunch', 0.35], ['Snack', 0.1], ['Dinner', 0.3]]

// What to put on the plate — Mediterranean-style, with options for each eating style.
const IDEAS = {
  veg: {
    Breakfast: 'Oats cooked in milk with nuts & fruit, or paneer bhurji with 2 rotis',
    Lunch: 'Dal + rajma/chole, brown rice or 2 rotis, big salad, curd',
    Snack: 'Greek yogurt or roasted chana with fruit',
    Dinner: 'Paneer or tofu tikka, sabzi (½ plate), 1–2 rotis'
  },
  egg: {
    Breakfast: '3 eggs (omelette/bhurji) with whole-wheat toast and fruit',
    Lunch: 'Dal, rice or rotis, egg curry, salad, curd',
    Snack: 'Boiled eggs or Greek yogurt with fruit',
    Dinner: 'Paneer/egg + vegetables (½ plate), 1–2 rotis'
  },
  nonveg: {
    Breakfast: 'Eggs or Greek yogurt with oats and fruit',
    Lunch: 'Grilled chicken or fish, rice or rotis, dal, salad',
    Snack: 'Whey shake or boiled eggs with fruit',
    Dinner: 'Chicken/fish curry, vegetables (½ plate), small portion of rice or roti'
  },
  vegan: {
    Breakfast: 'Oats with soy milk, peanut butter & banana, or tofu scramble',
    Lunch: 'Dal + chole/rajma, brown rice, salad',
    Snack: 'Roasted chana, nuts, or a soy/pea protein shake',
    Dinner: 'Tofu or soya chunks with vegetables (½ plate), 1–2 rotis'
  }
}

export function mealPlanOf(t, diet) {
  const ideas = IDEAS[diet] || IDEAS.veg
  return SPLIT.map(([meal, share]) => ({
    meal, kcal: Math.round((t.kcal * share) / 10) * 10, protein: Math.round(t.protein * share), idea: ideas[meal]
  }))
}

export const PLATE_RULES = [
  'Fill half the plate with vegetables or salad',
  'A quarter with protein: dal, paneer, tofu, eggs, chicken or fish',
  'A quarter with whole grains: roti, brown rice, oats, millets',
  'Use a little olive/mustard oil or ghee, nuts and seeds for healthy fats',
  'Cut sugary drinks, sweets and fried snacks — they are the easiest calories to drop',
  'Sleep 7–9 hours: short sleep makes hunger and fat loss harder'
]

// A small built-in food list (approximate values per serving, USDA/label averages). Users
// can log anything else with "Custom food", which is remembered for next time.
export const FOODS = [
  { id: 'egg', n: 'Egg, whole (1 large)', kcal: 72, p: 6.3, c: 0.4, f: 4.8 },
  { id: 'eggw', n: 'Egg white (1)', kcal: 17, p: 3.6, c: 0.2, f: 0.1 },
  { id: 'chk', n: 'Chicken breast, cooked (100 g)', kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'fish', n: 'Fish, salmon cooked (100 g)', kcal: 206, p: 22, c: 0, f: 12 },
  { id: 'tuna', n: 'Tuna in water (100 g)', kcal: 116, p: 26, c: 0, f: 0.8 },
  { id: 'paneer', n: 'Paneer (100 g)', kcal: 265, p: 18, c: 3, f: 20 },
  { id: 'tofu', n: 'Tofu, firm (100 g)', kcal: 144, p: 17, c: 3, f: 9 },
  { id: 'soya', n: 'Soya chunks, dry (50 g)', kcal: 173, p: 26, c: 17, f: 0.3 },
  { id: 'dal', n: 'Dal / lentils, cooked (1 cup)', kcal: 230, p: 18, c: 40, f: 0.8 },
  { id: 'chole', n: 'Chickpeas / chole, cooked (1 cup)', kcal: 269, p: 14.5, c: 45, f: 4.2 },
  { id: 'rajma', n: 'Rajma / kidney beans, cooked (1 cup)', kcal: 225, p: 15, c: 40, f: 0.9 },
  { id: 'curd', n: 'Curd / dahi (1 cup)', kcal: 149, p: 8.5, c: 11.4, f: 8 },
  { id: 'greek', n: 'Greek yogurt, plain low-fat (170 g)', kcal: 100, p: 17, c: 6, f: 0.7 },
  { id: 'milk', n: 'Milk, whole (250 ml)', kcal: 150, p: 8, c: 12, f: 8 },
  { id: 'milks', n: 'Milk, skimmed (250 ml)', kcal: 86, p: 8.4, c: 12, f: 0.2 },
  { id: 'whey', n: 'Whey protein (1 scoop, 30 g)', kcal: 120, p: 24, c: 3, f: 1.5 },
  { id: 'rice', n: 'Rice, cooked (1 cup)', kcal: 205, p: 4.3, c: 45, f: 0.4 },
  { id: 'roti', n: 'Roti / chapati (1 medium)', kcal: 120, p: 3, c: 18, f: 3.7 },
  { id: 'bread', n: 'Whole-wheat bread (1 slice)', kcal: 80, p: 4, c: 14, f: 1 },
  { id: 'oats', n: 'Oats, dry (40 g)', kcal: 152, p: 5.3, c: 27, f: 2.7 },
  { id: 'idli', n: 'Idli (1 piece)', kcal: 58, p: 2, c: 12, f: 0.4 },
  { id: 'dosa', n: 'Dosa, plain (1)', kcal: 120, p: 3, c: 20, f: 3 },
  { id: 'poha', n: 'Poha (1 cup)', kcal: 180, p: 3.5, c: 33, f: 4 },
  { id: 'potato', n: 'Potato, boiled (150 g)', kcal: 130, p: 2.8, c: 30, f: 0.2 },
  { id: 'sweetp', n: 'Sweet potato, baked (150 g)', kcal: 135, p: 3, c: 31, f: 0.2 },
  { id: 'veg', n: 'Vegetables / salad (1 bowl)', kcal: 50, p: 2, c: 10, f: 0.3 },
  { id: 'banana', n: 'Banana (1 medium)', kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { id: 'apple', n: 'Apple (1 medium)', kcal: 95, p: 0.5, c: 25, f: 0.3 },
  { id: 'almond', n: 'Almonds (28 g, ~23 nuts)', kcal: 164, p: 6, c: 6, f: 14 },
  { id: 'pb', n: 'Peanut butter (2 tbsp)', kcal: 190, p: 7, c: 7, f: 16 },
  { id: 'oil', n: 'Oil, any (1 tbsp)', kcal: 120, p: 0, c: 0, f: 13.5 },
  { id: 'ghee', n: 'Ghee (1 tsp)', kcal: 45, p: 0, c: 0, f: 5 },
  { id: 'pizza', n: 'Pizza (1 slice)', kcal: 285, p: 12, c: 36, f: 10 },
  { id: 'cola', n: 'Cola (330 ml can)', kcal: 139, p: 0, c: 35, f: 0 }
]

// Totals of one day's food log.
export function dayTotals(entries) {
  const s = { kcal: 0, p: 0, c: 0, f: 0 }
  ;(entries || []).forEach(e => {
    const q = e.q || 1
    s.kcal += e.kcal * q; s.p += e.p * q; s.c += e.c * q; s.f += e.f * q
  })
  return { kcal: Math.round(s.kcal), p: Math.round(s.p), c: Math.round(s.c), f: Math.round(s.f) }
}
