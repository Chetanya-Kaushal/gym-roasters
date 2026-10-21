import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { gsap } from 'gsap'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { DAYN } from '../lib/format.js'
import { PROGRAMS, buildProgram, programFilters } from '../lib/programs.js'
import { confirmSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import DayPreview from '../components/DayPreview.jsx'
import { Button, Segmented } from '../components/ui.jsx'
import { TextReveal } from '../fx/showcase.jsx'
import { reducedMotion } from '../fx/motion.js'

function Chips({ options, value, onChange }) {
  return <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
    {options.map(([v, l]) => <motion.button key={v} whileTap={{ scale: 0.94 }} className={'chip' + (value === v ? ' on' : '')} onClick={() => onChange(v)}>{t(l)}</motion.button>)}
  </div>
}

function ProgramCard({ p, open, onToggle, onStart, unit }) {
  const [level, setLevel] = useState(p.level)
  const built = useMemo(() => (open ? buildProgram(p, level) : null), [open, level, p])
  return <div className="card prog-card" style={{ overflow: 'hidden' }}>
    <div onClick={onToggle} style={{ cursor: 'pointer' }}>
      <div className="row between">
        <span className="tag acc">{t(p.tag)}</span>
        <span className="small dim">{t('{0} days/wk · {1} weeks', p.days, p.weeks)}</span>
      </div>
      <div style={{ margin: '10px 0 4px', fontSize: 21, fontWeight: 700, letterSpacing: '-.02em' }}>{t(p.name)}</div>
      <div className="small muted" style={{ lineHeight: 1.45 }}>{t(p.about)}</div>
    </div>
    <AnimatePresence initial={false}>
      {open && built && <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 24 }}>
        <div style={{ margin: '14px 0 8px' }}>
          <Segmented options={[{ value: 'beginner', label: t('Beginner') }, { value: 'intermediate', label: t('Experienced') }]} value={level} onChange={setLevel} />
        </div>
        {[1, 2, 3, 4, 5, 6, 0].filter(d => built.week[d]).map(d => {
          const r = built.routines.find(x => x.id === built.week[d])
          return <details key={d} style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t(DAYN[d])} · {t(r.name)} <span className="small dim">({r.ex.filter(e => !e.wu).length} {t('exercises')})</span></summary>
            <DayPreview ex={r.ex} unit={unit} />
          </details>
        })}
        <Button variant="primary" icon="sparkles" style={{ marginTop: 14 }} onClick={() => onStart(built)}>{t('Start this program')}</Button>
      </motion.div>}
    </AnimatePresence>
  </div>
}

export default function Programs() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const toast = useUI(s => s.toast)
  const [f, setF] = useState({ goal: S.profile?.goal || 'all', who: S.profile?.sex === 'female' ? 'all' : 'all', equip: 'all' })
  const [open, setOpen] = useState(null)
  const list = PROGRAMS.filter(p => (f.goal === 'all' || p.goals.includes(f.goal)) && (f.who === 'all' || p.for === f.who) && (f.equip === 'all' || p.equip === f.equip))
  // women's programs first for women, but every program is open to everyone
  if (S.profile?.sex === 'female') list.sort((a, b) => (b.for === 'women') - (a.for === 'women'))
  const root = useRef(null)

  // Cards drop in with a soft physical settle (slight overshoot, then rest).
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.prog-card', { y: 40, opacity: 0, rotationX: -12, transformOrigin: '50% 0%', transformPerspective: 800, duration: 0.9, ease: 'elastic.out(1, 0.75)', stagger: 0.07 })
    }, root)
    return () => ctx.revert()
  }, [f.goal, f.who, f.equip])

  const start = built => confirmSheet({
    title: t('Start this program?'),
    message: t('It replaces your weekly schedule and any previous smart plan or program. Routines you made yourself are kept.'),
    confirmText: t('Start'),
    onConfirm: () => {
      update(s => { s.routines = s.routines.filter(r => !r.smart).concat(built.routines); s.week = built.week })
      toast(t('Program started — see your week in Plan'))
      nav('/plan')
    }
  })

  return <div ref={root} className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}>
        <TextReveal>{t('Programs')}</TextReveal>
        <div className="sub">{t('{0} expert-built plans', PROGRAMS.length)}</div>
      </div>
    </div>
    <Chips options={programFilters.goal} value={f.goal} onChange={v => setF(x => ({ ...x, goal: v }))} />
    <Chips options={programFilters.who} value={f.who} onChange={v => setF(x => ({ ...x, who: v }))} />
    <Chips options={programFilters.equip} value={f.equip} onChange={v => setF(x => ({ ...x, equip: v }))} />
    {list.map(p => <ProgramCard key={p.id} p={p} unit={S.unit} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} onStart={start} />)}
    {!list.length && <div className="empty">{t('No program matches these filters.')}</div>}
    <div style={{ height: 24 }} />
  </div>
}
