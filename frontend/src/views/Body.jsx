import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { t, dateLocale } from '../lib/i18n.js'
import { todayISO, fmtDate } from '../lib/format.js'
import { lastDays } from '../lib/activity.js'
import { listPhotos, addPhoto, deletePhoto } from '../lib/photos.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField } from '../components/ui.jsx'
import { useShowcase, TextReveal } from '../fx/showcase.jsx'

const PARTS = [['waist', 'Waist'], ['hips', 'Hips'], ['chest', 'Chest'], ['arm', 'Arm'], ['thigh', 'Thigh']]

// Bars for the last 7 days of a per-day number (sleep hours, steps).
function WeekBars({ values, goal, color, fmt }) {
  const max = Math.max(goal, ...values.map(v => v.v || 0)) || 1
  return <div className="row" style={{ alignItems: 'flex-end', gap: 8, height: 110 }}>
    {values.map((v, i) => <div key={v.d} style={{ flex: 1, textAlign: 'center' }}>
      <div className="small dim" style={{ fontSize: 10, height: 14 }}>{v.v ? fmt(v.v) : ''}</div>
      <motion.div initial={{ height: 0 }} animate={{ height: ((v.v || 0) / max) * 76 }} transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.05 }}
        style={{ background: (v.v || 0) >= goal ? color : color + '66', borderRadius: 6, minHeight: 3 }} />
      <div className="small dim" style={{ marginTop: 4 }}>{new Date(v.d + 'T12:00:00').toLocaleDateString(dateLocale(), { weekday: 'narrow' })}</div>
    </div>)}
  </div>
}

export default function Body() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const root = useRef(null)
  useShowcase(root)
  const today = todayISO()
  const last = (S.measures || [])[S.measures?.length - 1] || {}
  const [m, setM] = useState(() => Object.fromEntries(PARTS.map(([k]) => [k, null])))
  const [photos, setPhotos] = useState([])
  const [urls, setUrls] = useState({})
  const fileRef = useRef(null)
  const days = lastDays(7)

  const refresh = () => listPhotos().then(setPhotos).catch(() => setPhotos([]))
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    const u = Object.fromEntries(photos.map(p => [p.id, URL.createObjectURL(p.blob)]))
    setUrls(u)
    return () => Object.values(u).forEach(URL.revokeObjectURL)
  }, [photos])

  const saveMeasures = () => {
    const entry = { d: today }
    PARTS.forEach(([k]) => { if (m[k] > 0) entry[k] = m[k] })
    if (Object.keys(entry).length < 2) return
    update(s => {
      s.measures = (s.measures || []).filter(x => x.d !== today)
      s.measures.push(entry); s.measures.sort((a, b) => (a.d < b.d ? -1 : 1))
    })
    setM(Object.fromEntries(PARTS.map(([k]) => [k, null])))
  }
  const first = (S.measures || [])[0]

  return <div ref={root} className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/you')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><TextReveal>{t('Body & sleep')}</TextReveal></div>
    </div>

    <div className="card" data-reveal>
      <h2 style={{ marginTop: 0 }}>{t('Measurements (cm)')}</h2>
      {PARTS.map(([k, label]) => <div key={k} className="row between" style={{ margin: '8px 0' }}>
        <span>{t(label)}</span>
        <span className="row" style={{ gap: 10 }}>
          {last[k] && <span className="small dim">{last[k]}{first && first[k] && first !== last ? ` (${last[k] - first[k] > 0 ? '+' : ''}${(last[k] - first[k]).toFixed(1)})` : ''}</span>}
          <span style={{ width: 90 }}><NumberField className="field" nullable value={m[k]} onChange={v => setM(x => ({ ...x, [k]: v }))} placeholder={last[k] ? String(last[k]) : '—'} /></span>
        </span>
      </div>)}
      <Button variant="primary" onClick={saveMeasures} style={{ marginTop: 6 }}>{t('Save today')}</Button>
      {(S.measures || []).length > 0 && <div className="small dim" style={{ marginTop: 8 }}>{t('{0} check-ins since {1}', S.measures.length, fmtDate(first.d))}</div>}
    </div>

    <div className="card" data-reveal>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{t('Progress photos')}</h2>
        <Button size="sm" variant="tinted" icon="plus" onClick={() => fileRef.current.click()}>{t('Add')}</Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={async e => {
          const f = e.target.files[0]; e.target.value = ''
          if (f) { await addPhoto(f, today); refresh() }
        }} />
      </div>
      <div className="small dim" style={{ marginBottom: 10 }}>{t('Saved only on this phone — never uploaded.')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <AnimatePresence>
          {photos.map(p => <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)' }}>
            {urls[p.id] && <img src={urls[p.id]} alt={t('Progress photo {0}', fmtDate(p.d))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <span className="small" style={{ position: 'absolute', left: 6, bottom: 4, color: '#fff', textShadow: '0 1px 3px #000' }}>{fmtDate(p.d)}</span>
            <button className="iconbtn" aria-label={t('Delete')} style={{ position: 'absolute', right: 4, top: 4, width: 28, height: 28 }}
              onClick={async () => { await deletePhoto(p.id); refresh() }}><Icon name="trash" /></button>
          </motion.div>)}
        </AnimatePresence>
      </div>
    </div>

    <div className="card" data-reveal>
      <h2 style={{ marginTop: 0 }}>{t('Sleep')}</h2>
      <WeekBars values={days.map(d => ({ d, v: (S.sleep || {})[d]?.h }))} goal={7} color="#a78bfa" fmt={v => v + 'h'} />
      <div className="dim small" style={{ marginTop: 8 }}>{t('Log last night’s sleep on the You tab. Goal: 7–9 hours.')}</div>
    </div>

    <div className="card" data-reveal>
      <h2 style={{ marginTop: 0 }}>{t('Steps')}</h2>
      <WeekBars values={days.map(d => ({ d, v: (S.steps || {})[d] }))} goal={8000} color="#38d0ff" fmt={v => (v / 1000).toFixed(1) + 'k'} />
    </div>
    <div style={{ height: 24 }} />
  </div>
}
