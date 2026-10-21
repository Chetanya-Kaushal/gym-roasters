import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { todayISO, isoOf, fmtDate, uid } from '../lib/format.js'
import { lastBW, effectiveRoutine } from '../lib/history.js'
import { FOODS, PLATE_RULES, targetsOf, waterTargetOf, dayTotals, mealPlanOf } from '../lib/nutrition.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, SearchField, TextField } from '../components/ui.jsx'

const LB = 2.20462

// A labelled progress bar: eaten / target, with what is left (or how far over).
function Meter({ label, have, goal, unit, color }) {
  const pct = goal ? Math.min(100, (have / goal) * 100) : 0
  const left = goal - have
  return <div style={{ margin: '10px 0' }}>
    <div className="row between small">
      <b>{t(label)}</b>
      <span className="muted">{have} / {goal} {unit} · {left >= 0 ? t('{0} {1} to go', left, unit) : t('{0} {1} over', -left, unit)}</span>
    </div>
    <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden', marginTop: 5 }}>
      <i style={{ display: 'block', height: '100%', width: pct + '%', background: left < 0 && label === 'Calories' ? 'var(--red)' : color, transition: 'width .3s' }} />
    </div>
  </div>
}

export default function Food() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [day, setDay] = useState(todayISO())
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [custom, setCustom] = useState(null)
  const [showDiet, setShowDiet] = useState(false)

  const prof = S.profile && !S.profile.skipped ? S.profile : null
  const bw = lastBW(S)
  const kg = bw ? (S.unit === 'lb' ? bw.w / LB : bw.w) : prof?.weightKg
  const tg = prof ? targetsOf(prof, kg) : null
  const entries = (S.food || {})[day] || []
  const tot = dayTotals(entries)
  const water = (S.water || {})[day] || 0
  const training = !!effectiveRoutine(S, day)
  const waterGoal = waterTargetOf(tg, training)
  const isToday = day === todayISO()

  const shift = n => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); setDay(isoOf(d)) }
  const editDay = fn => update(s => { s.food = s.food || {}; s.food[day] = s.food[day] || []; fn(s.food[day]); if (!s.food[day].length) delete s.food[day] })
  const addFood = f => { editDay(list => list.push({ id: uid(), n: f.n, kcal: f.kcal, p: f.p, c: f.c, f: f.f, q: 1 })); setAdding(false); setQ('') }
  const setQty = (id, dq) => editDay(list => {
    const i = list.findIndex(e => e.id === id)
    if (i < 0) return
    const nq = Math.round(((list[i].q || 1) + dq) * 2) / 2
    if (nq <= 0) list.splice(i, 1); else list[i].q = nq
  })
  const addWater = ml => update(s => { s.water = s.water || {}; s.water[day] = Math.max(0, (s.water[day] || 0) + ml) })
  const saveCustom = () => {
    const f = { id: 'my' + uid(), n: custom.n.trim(), kcal: custom.kcal || 0, p: custom.p || 0, c: custom.c || 0, f: custom.f || 0 }
    if (!f.n) return
    update(s => { s.myFoods = [f, ...(s.myFoods || []).filter(x => x.n !== f.n)].slice(0, 100) })
    addFood(f); setCustom(null)
  }

  const ql = q.trim().toLowerCase()
  const list = [...(S.myFoods || []), ...FOODS].filter(f => !ql || f.n.toLowerCase().includes(ql))

  return <div className="narrow">
    <div className="hdr">
      <div style={{ flex: 1 }}><h1>{t('Nutrition')}</h1><div className="sub">{isToday ? t('Today') : fmtDate(day)}</div></div>
      <button className="iconbtn" onClick={() => shift(-1)} aria-label={t('Previous day')}><Icon name="chevronLeft" /></button>
      <button className="iconbtn" onClick={() => shift(1)} disabled={isToday} aria-label={t('Next day')}><Icon name="chevronRight" /></button>
    </div>

    {!tg && <div className="card">
      <div className="muted small" style={{ marginBottom: 10 }}>{t('Answer a few questions to get your calorie, protein and water targets.')}</div>
      <Button variant="primary" icon="sparkles" onClick={() => nav('/start')}>{t('Set up my plan')}</Button>
    </div>}

    <div className="card">
      {tg ? <>
        <Meter label="Calories" have={tot.kcal} goal={tg.kcal} unit="kcal" color="var(--acc)" />
        <Meter label="Protein" have={tot.p} goal={tg.protein} unit="g" color="var(--orange)" />
        <Meter label="Carbs" have={tot.c} goal={tg.carbs} unit="g" color="var(--teal)" />
        <Meter label="Fat" have={tot.f} goal={tg.fat} unit="g" color="var(--purple)" />
      </> : <div className="row between"><b>{t('Eaten')}</b><span>{tot.kcal} kcal · {tot.p} g {t('protein')}</span></div>}
    </div>

    <div className="card">
      <Meter label="Water" have={water} goal={waterGoal} unit="ml" color="var(--blue)" />
      {training && <div className="dim small">{t('Training day: +500 ml added to your goal.')}</div>}
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <Button size="sm" onClick={() => addWater(-250)}>−250</Button>
        <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => addWater(250)}>+250 ml</Button>
        <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => addWater(500)}>+500 ml</Button>
      </div>
    </div>

    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{t('Food log')}</h2>
        <Button size="sm" variant="tinted" icon="plus" onClick={() => { setAdding(!adding); setCustom(null) }}>{t('Add')}</Button>
      </div>

      {adding && !custom && <>
        <SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} placeholder={t('Search foods')} />
        <div className="sect-b" style={{ maxHeight: 320, overflowY: 'auto', marginTop: 8 }}>
          {list.map(f => <button key={f.id} className="lrow tap" onClick={() => addFood(f)}>
            <span className="lrow-m"><span className="lrow-t">{f.n}</span><span className="lrow-s">{f.kcal} kcal · {f.p} g {t('protein')}</span></span>
            <Icon name="plus" className="lrow-k" />
          </button>)}
        </div>
        <Button size="sm" style={{ marginTop: 8 }} onClick={() => setCustom({ n: q, kcal: null, p: null, c: null, f: null })}>{t('Custom food')}</Button>
      </>}

      {custom && <div style={{ marginBottom: 10 }}>
        <TextField value={custom.n} onChange={e => setCustom({ ...custom, n: e.target.value })} placeholder={t('Food name and portion')} />
        {[['kcal', 'Calories (kcal)'], ['p', 'Protein (g)'], ['c', 'Carbs (g)'], ['f', 'Fat (g)']].map(([k, label]) =>
          <div key={k} className="row between" style={{ marginTop: 8 }}>
            <span>{t(label)}</span>
            <div style={{ width: 100 }}><NumberField className="field" nullable value={custom[k]} onChange={v => setCustom(c => ({ ...c, [k]: v }))} /></div>
          </div>)}
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <Button style={{ flex: 1 }} onClick={() => setCustom(null)}>{t('Cancel')}</Button>
          <Button variant="primary" style={{ flex: 1 }} disabled={!custom.n.trim()} onClick={saveCustom}>{t('Add')}</Button>
        </div>
      </div>}

      {entries.length ? entries.map(e => <div key={e.id} className="row between" style={{ padding: '8px 0', borderTop: '1px solid var(--sep)' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div>{e.n}</div>
          <div className="muted small">{Math.round(e.kcal * (e.q || 1))} kcal · {Math.round(e.p * (e.q || 1))} g {t('protein')}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="iconbtn" onClick={() => setQty(e.id, -0.5)} aria-label={t('Less')}><Icon name="minus" /></button>
          <b style={{ minWidth: 30, textAlign: 'center' }}>×{e.q || 1}</b>
          <button className="iconbtn" onClick={() => setQty(e.id, 0.5)} aria-label={t('More')}><Icon name="plus" /></button>
        </div>
      </div>) : !adding && <div className="muted small">{t('Nothing logged yet.')}</div>}
    </div>

    {tg && <div className="card">
      <div className="row between" onClick={() => setShowDiet(!showDiet)} style={{ cursor: 'pointer' }}>
        <h2 style={{ margin: 0 }}>{t('Your diet plan')}</h2>
        <Icon name={showDiet ? 'chevronUp' : 'chevronDown'} />
      </div>
      {showDiet && <>
        <div className="muted small" style={{ margin: '8px 0' }}>{t('Mediterranean-style eating: the most consistently top-rated, best-studied diet pattern. Hit your protein, stay near your calories, and the rest follows.')}</div>
        {mealPlanOf(tg, prof.diet).map(m => <div key={m.meal} style={{ marginBottom: 8 }}>
          <div className="row between"><b>{t(m.meal)}</b><span className="muted small">~{m.kcal} kcal · {m.protein} g</span></div>
          <div className="muted small">{t(m.idea)}</div>
        </div>)}
        <ul className="small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>{PLATE_RULES.map(r => <li key={r}>{t(r)}</li>)}</ul>
        {tg.notes.map(n => <div key={n} className="small" style={{ marginTop: 6, color: 'var(--yellow)' }}>{t(n)}</div>)}
        <Button size="sm" style={{ marginTop: 8 }} onClick={() => nav('/start')}>{t('Update my answers')}</Button>
      </>}
    </div>}
    <div style={{ height: 20 }} />
  </div>
}
