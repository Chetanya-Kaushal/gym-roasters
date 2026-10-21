import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { fmtDate, isoOf } from '../lib/format.js'
import { PROTOCOLS, stageOf } from '../lib/fasting.js'
import { celebrate } from '../fx/motion.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

const hm = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` }

// Intermittent fasting timer (Yazio/Zero style): pick a protocol, start, watch the stages.
export default function Fast() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id) }, [])
  const f = S.fast
  const plan = S.fastPlan || '16:8'
  const goalH = (PROTOCOLS.find(p => p[0] === plan) || PROTOCOLS[2])[1]
  const elapsed = f ? Date.now() - f.start : 0
  const p = f ? Math.min(1, elapsed / (f.hours * 3600000)) : 0
  const stage = f ? stageOf(elapsed / 3600000) : null
  const R = 120, C = 2 * Math.PI * R

  const start = () => update(s => { s.fast = { start: Date.now(), hours: goalH, plan } })
  const end = () => {
    const done = elapsed >= f.hours * 3600000
    update(s => { s.fasts = [...(s.fasts || []), { start: f.start, end: Date.now(), hours: f.hours, plan: f.plan }].slice(-60); s.fast = null })
    if (done) celebrate()
  }
  const history = [...(S.fasts || [])].reverse().slice(0, 7)

  return <div className="narrow" style={{ textAlign: 'center' }}>
    <div className="hdr" style={{ textAlign: 'left' }}>
      <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><h1>{t('Fasting')}</h1><div className="sub">{t('Time-restricted eating')}</div></div>
    </div>

    <div style={{ position: 'relative', width: 280, height: 280, margin: '6px auto 14px' }}>
      <svg width="280" height="280" viewBox="0 0 280 280">
        <defs><linearGradient id="fastg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38d0ff" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
        <circle cx="140" cy="140" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
        <motion.circle cx="140" cy="140" r={R} fill="none" stroke="url(#fastg)" strokeWidth="18" strokeLinecap="round" strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - p) }} transition={{ type: 'spring', stiffness: 40, damping: 18 }} transform="rotate(-90 140 140)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="small dim">{f ? t('Fasting for') : t('Ready to fast')}</div>
        <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>{f ? hm(elapsed) : `${goalH}:00`}</div>
        <div className="small dim">{f ? (p >= 1 ? t('Goal reached!') : t('{0} to go', hm(f.hours * 3600000 - elapsed))) : t('{0} protocol', plan)}</div>
      </div>
    </div>

    <AnimatePresence mode="wait">{stage && <motion.div key={stage[1]} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ textAlign: 'left' }}>
      <b>{t(stage[1])}</b><div className="small muted">{t(stage[2])}</div>
    </motion.div>}</AnimatePresence>

    {!f && <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
      {PROTOCOLS.map(([id, , sub]) => <button key={id} className={'chip' + (plan === id ? ' on' : '')} style={{ textTransform: 'none' }} onClick={() => update(s => { s.fastPlan = id })}>
        {id} <span className="dim" style={{ fontSize: 11 }}>· {t(sub)}</span></button>)}
    </div>}
    {f ? <Button variant="primary" onClick={end}>{t('End fast')}</Button> : <Button variant="primary" icon="play" onClick={start}>{t('Start fasting')}</Button>}

    {history.length > 0 && <div className="card" style={{ textAlign: 'left', marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t('Recent fasts')}</h2>
      {history.map(h => { const hrs = (h.end - h.start) / 3600000; return <div key={h.start} className="row between" style={{ padding: '6px 0', borderTop: '1px solid var(--sep)' }}>
        <span>{fmtDate(isoOf(new Date(h.start)))}</span><span className="small">{hrs.toFixed(1)} h / {h.hours} h {hrs >= h.hours ? '✓' : ''}</span>
      </div> })}
    </div>}
    <div className="small dim" style={{ marginTop: 14, textAlign: 'left', lineHeight: 1.5 }}>
      {t('Fasting helps some people eat less; for weight loss it works about as well as any calorie deficit. Drink water, tea or black coffee while fasting. Skip fasting if you are pregnant, diabetic on medication, under 18, or have a history of eating disorders.')}
    </div>
    <div style={{ height: 24 }} />
  </div>
}
