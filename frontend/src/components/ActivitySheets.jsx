import { useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { todayISO, isoOf, uid } from '../lib/format.js'
import { ACTIVITY_TYPES, dayActivity } from '../lib/activity.js'
import { celebrate } from '../fx/motion.js'
import Icon from './Icon.jsx'
import { Button, Stepper, Slider } from './ui.jsx'

const open = C => useUI.getState().openSheet(close => <C close={close} />)
const plusDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d) }

function Goals({ close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const a = dayActivity(S, todayISO())
  const [g, setG] = useState({ move: a.move.goal, ex: a.exercise.goal, water: (S.waterGoal || a.tg?.water || 2000) / 1000 })
  return <>
    <h3>{t('Change goals')}</h3>
    <div className="row cfgrow" style={{ marginBottom: 14 }}>
      <Stepper label={t('Move (kcal)')} value={g.move} step={10} decimal={false} onChange={v => setG(x => ({ ...x, move: Math.max(50, v) }))} />
      <Stepper label={t('Exercise (min)')} value={g.ex} step={5} decimal={false} onChange={v => setG(x => ({ ...x, ex: Math.max(5, v) }))} />
      <Stepper label={t('Water (L)')} value={g.water} step={0.1} onChange={v => setG(x => ({ ...x, water: Math.max(0.5, Math.round(v * 10) / 10) }))} />
    </div>
    <div className="small dim" style={{ marginBottom: 14 }}>{t('On training days 0.5 L is added to the water goal automatically.')}</div>
    <Button variant="primary" onClick={() => { update(s => { s.moveGoal = g.move; s.exerciseGoal = g.ex; s.waterGoal = Math.round(g.water * 1000) }); close() }}>{t('Save')}</Button>
    <div style={{ height: 8 }} />
    <Button onClick={() => { update(s => { s.moveGoal = null; s.exerciseGoal = null; s.waterGoal = null }); close() }}>{t('Use recommended goals')}</Button>
  </>
}

function Pause({ close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const today = todayISO()
  const active = (S.ringPause || []).find(p => p.to >= today)
  const pause = days => { update(s => { s.ringPause = [...(s.ringPause || []).filter(p => p.to < today), { from: today, to: plusDays(days - 1) }] }); close() }
  return <>
    <h3>{t('Pause rings')}</h3>
    <div className="small muted" style={{ marginBottom: 14 }}>{t('Rest, illness or travel — paused days don’t break your streaks.')}</div>
    {active && <div className="card small" style={{ marginBottom: 10 }}>{t('Paused until {0}', active.to)}</div>}
    {[[1, 'Today'], [3, '3 days'], [7, '1 week'], [30, '1 month']].map(([n, l]) => <Button key={n} style={{ marginBottom: 8 }} onClick={() => pause(n)}>{t(l)}</Button>)}
    {active && <Button variant="primary" onClick={() => { update(s => { s.ringPause = (s.ringPause || []).filter(p => p !== active && p.to < today).concat(active.from < today ? [{ from: active.from, to: plusDays(-1) }] : []) }); close() }}>{t('Resume rings')}</Button>}
  </>
}

function LogActivity({ close }) {
  const update = useStore(s => s.update)
  const [type, setType] = useState('run')
  const [min, setMin] = useState(30)
  const [effort, setEffort] = useState(5)
  const [km, setKm] = useState(0)
  const save = () => {
    update(s => { s.activities = [...(s.activities || []), { id: uid(), d: todayISO(), start: Date.now() - min * 60000, type, min, effort, ...(km > 0 ? { km } : {}) }] })
    celebrate({ particleCount: 40 })
    close()
  }
  const effLabel = effort <= 3 ? 'Easy' : effort <= 6 ? 'Moderate' : effort <= 8 ? 'Hard' : 'All out'
  return <>
    <h3>{t('Log a workout')}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
      {ACTIVITY_TYPES.map(([id, label, icon]) => <motion.button key={id} whileTap={{ scale: 0.92 }} onClick={() => setType(id)}
        className={'chip' + (type === id ? ' on' : '')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 2px', textTransform: 'none' }}>
        <Icon name={icon} /><span style={{ fontSize: 11 }}>{t(label)}</span>
      </motion.button>)}
    </div>
    <div className="row cfgrow" style={{ marginBottom: 14 }}>
      <Stepper label={t('Minutes')} value={min} step={5} decimal={false} onChange={v => setMin(Math.max(1, v))} />
      <Stepper label={t('Distance (km)')} value={km} step={0.5} onChange={v => setKm(Math.max(0, v))} />
    </div>
    <div className="row between small"><b>{t('Effort')}</b><span>{effort}/10 · {t(effLabel)}</span></div>
    <Slider value={effort} min={1} max={10} step={1} onChange={setEffort} />
    <div className="small dim" style={{ margin: '6px 0 14px' }}>{t('How hard did it feel? Effort feeds your training load.')}</div>
    <Button variant="primary" onClick={save}>{t('Save workout')}</Button>
  </>
}

export const goalsSheet = () => open(Goals)
export const pauseSheet = () => open(Pause)
export const logActivitySheet = () => open(LogActivity)
