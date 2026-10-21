import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { uid } from '../lib/format.js'
import { dayTotals } from '../lib/nutrition.js'
import Icon from './Icon.jsx'
import { Button, TextArea } from './ui.jsx'

// Shrink a photo to ≤768 px JPEG before sending — enough detail for food, small upload.
async function toDataUrl(file) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 768 / Math.max(bmp.width, bmp.height))
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) })
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.8)
}

// "Snap or describe a meal": AI estimates each food's calories and macros, shows what the
// day will look like after it, and logs it in one tap.
export default function MealAI({ day, tg }) {
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const config = useStore(s => s.config)
  const update = useStore(s => s.update)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const file = useRef(null)
  if (!config?.foodAI) return null

  const run = async () => {
    setBusy(true); setErr(''); setRes(null)
    try { setRes(await api('/api/food/analyze', { method: 'POST', body: JSON.stringify({ text, image: photo }) })) }
    catch (e) { setErr(e.message) }
    setBusy(false)
  }
  const sum = res ? res.items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }), { kcal: 0, p: 0, c: 0, f: 0 }) : null
  const now = dayTotals((S.food || {})[day])
  const log = () => {
    update(s => {
      s.food = s.food || {}; s.food[day] = s.food[day] || []
      res.items.forEach(i => s.food[day].push({ id: uid(), n: `${i.name} (${i.portion})`, kcal: i.kcal, p: i.protein, c: i.carbs, f: i.fat, q: 1, ai: true }))
    })
    setRes(null); setText(''); setPhoto(null)
  }
  const left = (goal, have) => Math.round(goal - have)

  return <div className="card">
    <div className="row" style={{ gap: 8, marginBottom: 8 }}>
      <span className="lrow-i"><Icon name="sparkles" /></span>
      <div><h2 style={{ margin: 0 }}>{t('Snap or describe a meal')}</h2><div className="small dim">{t('AI estimates calories, protein, carbs and fat')}</div></div>
    </div>
    {!user ? <div className="small muted">{t('Sign in with a passkey to use AI meal analysis.')}</div> : <>
      <TextArea rows={2} maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder={t('e.g. “2 rotis, a bowl of dal, paneer sabzi and a glass of lassi”')} />
      <AnimatePresence>{photo && <motion.img key="p" src={photo} alt="" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />}</AnimatePresence>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={async e => { const f = e.target.files[0]; e.target.value = ''; if (f) setPhoto(await toDataUrl(f)) }} />
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <Button size="sm" icon="plus" onClick={() => file.current.click()}>{photo ? t('Change photo') : t('Add photo')}</Button>
        <Button size="sm" variant="primary" style={{ flex: 1 }} icon="sparkles" disabled={busy || (!text.trim() && !photo)} onClick={run}>{busy ? t('Analysing…') : t('Analyse meal')}</Button>
      </div>
      {busy && <motion.div className="small dim" style={{ marginTop: 8 }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}>{t('Reading your meal…')}</motion.div>}
      {err && <div className="small" style={{ color: 'var(--red)', marginTop: 8 }}>{err}</div>}
      <AnimatePresence>{res && <motion.div key="r" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} style={{ marginTop: 12 }}>
        {res.items.length ? <>
          {res.items.map((i, k) => <div key={k} className="row between" style={{ padding: '6px 0', borderTop: '1px solid var(--sep)' }}>
            <div style={{ minWidth: 0 }}><div className="capitalize">{i.name}</div><div className="small dim">{i.portion}</div></div>
            <div className="small" style={{ textAlign: 'right' }}><b>{i.kcal} kcal</b><div className="dim">P {i.protein} · C {i.carbs} · F {i.fat} g</div></div>
          </div>)}
          <div className="row between" style={{ padding: '8px 0', borderTop: '1px solid var(--sep)', fontWeight: 700 }}>
            <span>{t('This meal')}</span><span>{Math.round(sum.kcal)} kcal · {Math.round(sum.p)} g {t('protein')}</span>
          </div>
          {tg && <div className="small" style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
            {t('After this meal you’ll still need')} <b>{Math.max(0, left(tg.kcal, now.kcal + sum.kcal))} kcal</b>, <b>{Math.max(0, left(tg.protein, now.p + sum.p))} g {t('protein')}</b>, {Math.max(0, left(tg.carbs, now.c + sum.c))} g {t('carbs')} {t('and')} {Math.max(0, left(tg.fat, now.f + sum.f))} g {t('fat')} {t('today')}.
            {left(tg.kcal, now.kcal + sum.kcal) < 0 && <div style={{ color: 'var(--orange)' }}>{t('This puts you {0} kcal over today’s target.', -left(tg.kcal, now.kcal + sum.kcal))}</div>}
          </div>}
          <div className="small dim" style={{ marginTop: 6 }}>{t('Confidence: {0}', t(res.confidence))} · {res.note}</div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <Button size="sm" style={{ flex: 1 }} onClick={() => setRes(null)}>{t('Discard')}</Button>
            <Button size="sm" variant="primary" style={{ flex: 1 }} icon="plus" onClick={log}>{t('Add to log')}</Button>
          </div>
        </> : <div className="small muted">{t('No food recognised — try a clearer photo or describe it.')}</div>}
      </motion.div>}</AnimatePresence>
      <div className="dim small" style={{ marginTop: 8, fontSize: 11 }}>{t('Estimates can be off by 20% or more — adjust portions in the log if needed. Photos are sent for analysis and not stored.')}</div>
    </>}
  </div>
}
