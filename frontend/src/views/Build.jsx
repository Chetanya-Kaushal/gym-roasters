import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { uid } from '../lib/format.js'
import { PARTS, KIT, MINUTES, buildSession } from '../lib/builder.js'
import { startFlow } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import DayPreview from '../components/DayPreview.jsx'
import { Button, Segmented } from '../components/ui.jsx'

// Train a particular body part today: pick muscles, kit and time → a ready session.
export default function Build() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const toast = useUI(s => s.toast)
  const [parts, setParts] = useState(['chest'])
  const [kit, setKit] = useState('gym')
  const [minutes, setMinutes] = useState(45)
  const [level, setLevel] = useState(S.profile?.level || 'beginner')
  const ex = useMemo(() => buildSession({ parts, kit, minutes, level }), [parts, kit, minutes, level])
  const toggle = p => setParts(v => p === 'full' ? ['full'] : v.includes(p) ? (v.length > 1 ? v.filter(x => x !== p) : v) : [...v.filter(x => x !== 'full'), p])
  const name = parts.map(p => t(PARTS.find(x => x[0] === p)[1])).join(' + ')

  const save = () => {
    const r = { id: uid(), name, emoji: 'figureStrength', ex, prog: 'double' }
    update(s => { s.routines.push(r) })
    return r
  }

  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><h1>{t('Build a workout')}</h1><div className="sub">{t('Train exactly what you want today')}</div></div>
    </div>
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t('Body parts')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {PARTS.map(([p, l]) => <motion.button key={p} whileTap={{ scale: 0.92 }} layout className={'chip' + (parts.includes(p) ? ' on' : '')}
          style={{ padding: '10px 4px', textAlign: 'center' }} onClick={() => toggle(p)}>{t(l)}</motion.button>)}
      </div>
      <h2>{t('Equipment')}</h2>
      <Segmented options={KIT.map(([value, l]) => ({ value, label: t(l) }))} value={kit} onChange={setKit} />
      <h2>{t('Time')}</h2>
      <Segmented options={MINUTES.map(m => ({ value: m, label: m + ' ' + t('min') }))} value={minutes} onChange={setMinutes} />
      <h2>{t('Level')}</h2>
      <Segmented options={[{ value: 'beginner', label: t('Beginner') }, { value: 'intermediate', label: t('Experienced') }]} value={level} onChange={setLevel} />
    </div>
    <div className="card">
      <div className="row between"><h2 style={{ margin: 0 }}>{name}</h2><span className="small dim">{ex.filter(e => !e.wu && e.reps).length} {t('exercises')}</span></div>
      <AnimatePresence mode="popLayout">
        <motion.div key={parts.join() + kit + minutes + level} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
          <DayPreview ex={ex} unit={S.unit} />
        </motion.div>
      </AnimatePresence>
    </div>
    <div className="row" style={{ gap: 10 }}>
      <Button style={{ flex: 1 }} icon="plus" onClick={() => { save(); toast(t('Saved to your routines')) }}>{t('Save')}</Button>
      <Button variant="primary" style={{ flex: 1 }} icon="play" disabled={!!S.active} onClick={() => { const r = save(); startFlow(r.id) }}>{t('Start now')}</Button>
    </div>
    <div style={{ height: 24 }} />
  </div>
}
