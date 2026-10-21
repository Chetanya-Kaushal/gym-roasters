import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { DAYN, todayISO } from '../lib/format.js'
import { lastBW } from '../lib/history.js'
import { SEXES, GOALS, LEVELS, DAY_OPTIONS, buildPlan, cardioMinutes, PROGRESSION } from '../lib/smartplan.js'
import { ACTIVITY, DIETS, targetsOf, mealPlanOf } from '../lib/nutrition.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Segmented } from '../components/ui.jsx'
import Hero3D from '../fx/Hero3D.jsx'
import { TextReveal, Spotlight } from '../fx/showcase.jsx'

/* First-run setup: who you are and what you want, then a workout plan and daily nutrition
   targets built from the answers (lib/smartplan.js, lib/nutrition.js). One topic per screen,
   like the Coach intake. */

const STEPS = ['sex', 'goal', 'body', 'training', 'result']
const LB = 2.20462

function Choice({ options, value, onPick }) {
  return <div className="sect-b">
    {options.map(([v, label, sub]) => <button key={v} className="lrow tap" onClick={() => onPick(v)}>
      <span className="lrow-m"><span className="lrow-t">{t(label)}</span>{sub && <span className="lrow-s">{t(sub)}</span>}</span>
      {value === v && <Icon name="check" className="lrow-k" />}
    </button>)}
  </div>
}

function Field({ label, children }) {
  return <div className="row between" style={{ margin: '10px 0' }}>
    <span>{label}</span>
    <div style={{ width: 110 }}>{children}</div>
  </div>
}

export default function Start() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const toast = useUI(s => s.toast)
  const lb = S.unit === 'lb'
  const bw = lastBW(S)
  const [step, setStep] = useState(0)
  const [p, setP] = useState(() => ({
    sex: S.body === 'female' ? 'female' : null, goal: null, level: 'beginner', days: 3,
    age: null, heightCm: null, weight: bw ? bw.w : null, activity: 'light', diet: 'veg',
    ...(S.profile || {})
  }))
  const set = patch => setP(v => ({ ...v, ...patch }))
  const key = STEPS[step]
  const weightKg = p.weight ? (lb ? p.weight / LB : p.weight) : null
  const tg = targetsOf({ ...p, weightKg })

  const canNext = (key === 'sex' && p.sex) || (key === 'goal' && p.goal) ||
    (key === 'body' && tg) || key === 'training'

  const apply = () => {
    const plan = buildPlan(p)
    update(s => {
      s.profile = { ...p, weightKg: Math.round(weightKg * 10) / 10 }
      s.body = p.sex
      const iso = todayISO()
      if (!s.bodyweight.some(b => b.d === iso)) {
        s.bodyweight.push({ d: iso, w: p.weight, t: Date.now() })
        s.bodyweight.sort((a, b) => (a.d < b.d ? -1 : 1))
      }
      // re-running the setup replaces the plan it made last time, never your own routines
      s.routines = s.routines.filter(r => !r.smart).concat(plan.routines)
      s.week = plan.week
    })
    toast(t('Your plan is ready'))
    nav('/home')
  }
  const skip = () => { update(s => { s.profile = s.profile || { skipped: true } }); nav('/home') }

  const meals = tg ? mealPlanOf(tg, p.diet) : []
  const plan = key === 'result' ? buildPlan(p) : null

  return <div className="narrow" style={{ position: 'relative' }}>
    <Spotlight />
    <div className="hdr">
      <button className="iconbtn" onClick={() => step ? setStep(step - 1) : skip()} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}>
        <h1>{t('Smart plan')}</h1>
        <div className="sub">{t('Step {0} of {1}', step + 1, STEPS.length)}</div>
      </div>
      {step === 0 && <Button size="sm" onClick={skip}>{t('Skip')}</Button>}
    </div>

    <div className="row" style={{ gap: 5, marginBottom: 14 }}>
      {STEPS.map((s, i) => <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? 'var(--acc)' : 'var(--surface-3)' }} />)}
    </div>

    <div className="card">
      {key === 'sex' && <>
        <Hero3D height={190} />
        <TextReveal as="h2" style={{ marginTop: 4, fontSize: 26, color: 'var(--label)' }}>{t('Let’s build your plan')}</TextReveal>
        <h2>{t('What is your sex?')}</h2>
        <div className="muted small" style={{ marginBottom: 10 }}>{t('Used for your calorie needs and to tailor the plan.')}</div>
        <Choice options={SEXES} value={p.sex} onPick={v => set({ sex: v })} />
      </>}

      {key === 'goal' && <>
        <h2 style={{ marginTop: 0 }}>{t('What is your main goal?')}</h2>
        <Choice options={GOALS} value={p.goal} onPick={v => set({ goal: v })} />
      </>}

      {key === 'body' && <>
        <h2 style={{ marginTop: 0 }}>{t('About you')}</h2>
        <Field label={t('Age')}><NumberField className="field" decimal={false} nullable value={p.age} onChange={v => set({ age: v })} placeholder="30" /></Field>
        <Field label={t('Height (cm)')}><NumberField className="field" decimal={false} nullable value={p.heightCm} onChange={v => set({ heightCm: v })} placeholder="170" /></Field>
        <Field label={t('Weight') + ` (${S.unit})`}><NumberField className="field" nullable value={p.weight} onChange={v => set({ weight: v })} placeholder={lb ? '160' : '70'} /></Field>
        <h2>{t('How active are you?')}</h2>
        <Choice options={ACTIVITY.map(([v, l]) => [v, l])} value={p.activity} onPick={v => set({ activity: v })} />
        <h2>{t('How do you eat?')}</h2>
        <Segmented options={DIETS.map(([value, label]) => ({ value, label: t(label) }))} value={p.diet} onChange={v => set({ diet: v })} />
      </>}

      {key === 'training' && <>
        <h2 style={{ marginTop: 0 }}>{t('Your experience')}</h2>
        <Choice options={LEVELS} value={p.level} onPick={v => set({ level: v })} />
        <h2>{t('Gym days per week')}</h2>
        <Segmented options={DAY_OPTIONS.map(n => ({ value: n, label: String(n) }))} value={p.days} onChange={v => set({ days: v })} />
      </>}

      {key === 'result' && tg && <>
        <h2 style={{ marginTop: 0 }}>{t('Your numbers')}</h2>
        <div className="row between"><span>{t('BMI')}</span><b style={{ color: tg.cls.color }}>{tg.bmi} · {t(tg.cls.label)}</b></div>
        <div className="row between" style={{ marginTop: 6 }}><span>{t('Calories / day')}</span><b>{tg.kcal} kcal</b></div>
        <div className="row between" style={{ marginTop: 6 }}><span>{t('Protein / day')}</span><b>{tg.protein} g</b></div>
        <div className="row between" style={{ marginTop: 6 }}><span>{t('Carbs · Fat')}</span><b>{tg.carbs} g · {tg.fat} g</b></div>
        <div className="row between" style={{ marginTop: 6 }}><span>{t('Water to drink / day')}</span><b>{(tg.water / 1000).toFixed(1)} L (+0.5 {t('on gym days')})</b></div>
        <div className="muted small" style={{ marginTop: 8 }}>
          {t('Maintenance ≈ {0} kcal. Expected change ≈ {1} kg/week.', tg.tdee, (tg.weeklyKg > 0 ? '+' : '') + tg.weeklyKg)}
        </div>
        {tg.asianNote && <div className="muted small" style={{ marginTop: 6 }}>{t('Note: for South & East Asian people, health risk already rises from a BMI of 23.')}</div>}
        {tg.notes.map(n => <div key={n} className="small" style={{ marginTop: 8, color: 'var(--yellow)' }}>{t(n)}</div>)}

        <h2>{t('Your meals')}</h2>
        {meals.map(m => <div key={m.meal} style={{ marginBottom: 8 }}>
          <div className="row between"><b>{t(m.meal)}</b><span className="muted small">~{m.kcal} kcal · {m.protein} g {t('protein')}</span></div>
          <div className="muted small">{t(m.idea)}</div>
        </div>)}

        <h2>{t('Your week')}</h2>
        {[1, 2, 3, 4, 5, 6, 0].map(d => {
          const r = plan.routines.find(x => x.id === plan.week[d])
          return <div key={d} className="row between" style={{ margin: '4px 0' }}>
            <span>{t(DAYN[d])}</span><span className={r ? 'tag acc' : 'tag'}>{r ? t(r.name) : t('Rest')}</span>
          </div>
        })}
        <div className="muted small" style={{ marginTop: 8 }}>{t('Cardio: {0} min/week', cardioMinutes(plan))}</div>
        <h2>{t('How to progress')}</h2>
        <ul className="small" style={{ paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>{PROGRESSION.map(r => <li key={r}>{t(r)}</li>)}</ul>
        <div className="dim small" style={{ marginTop: 12, lineHeight: 1.5 }}>
          {t('Estimates from standard formulas (Mifflin-St Jeor, WHO, ISSN) — not medical advice. Pregnant, under 18, or managing a condition? Ask a doctor first.')}
        </div>
      </>}
    </div>

    <div className="row" style={{ gap: 10 }}>
      {step > 0 && <Button onClick={() => setStep(step - 1)} style={{ flex: 1 }}>{t('Back')}</Button>}
      {key !== 'result'
        ? <Button variant="primary" style={{ flex: 1 }} disabled={!canNext} onClick={() => setStep(step + 1)}>{t('Next')}</Button>
        : <Button variant="primary" style={{ flex: 1 }} icon="sparkles" onClick={apply}>{t('Start my plan')}</Button>}
    </div>
    {key === 'result' && <Button style={{ marginTop: 10 }} onClick={() => { update(s => { s.profile = { ...p, weightKg: Math.round(weightKg * 10) / 10 }; s.body = p.sex }); nav('/programs') }}>{t('Or choose from 12 programs')}</Button>}
    {key === 'body' && !tg && <div className="dim small" style={{ textAlign: 'center', marginTop: 10 }}>{t('Enter age, height and weight to continue.')}</div>}
    <div style={{ height: 20 }} />
  </div>
}
