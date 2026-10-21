import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { gsap } from 'gsap'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { awardsOf } from '../lib/activity.js'
import Icon from '../components/Icon.jsx'
import { useShowcase, TextReveal, Spotlight, useTilt } from '../fx/showcase.jsx'
import { celebrate, reducedMotion } from '../fx/motion.js'

const COLORS = ['#ff4d6d', '#b7f34a', '#38d0ff', '#ffd166', '#c084fc']

function Badge({ a, i }) {
  const ref = useRef(null)
  useTilt(ref, 14)
  const toast = useUI(s => s.toast)
  const color = COLORS[i % COLORS.length]
  const r = 34, C = 2 * Math.PI * r
  return <motion.button ref={ref} className="badge" whileTap={{ scale: 0.94 }}
    onClick={() => toast(a.earned ? t('{0} — earned!', t(a.title)) : t(a.how) + ` · ${Math.round(a.p * 100)}%`)}
    style={{ background: 'none', border: 0, padding: 0, textAlign: 'center', cursor: 'pointer', color: 'inherit', opacity: 0 }}>
    <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto' }}>
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - a.p)} transform="rotate(-90 42 42)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        background: a.earned ? `radial-gradient(circle at 30% 25%, #fff8, ${color} 45%, #0006)` : 'var(--surface-2)',
        color: a.earned ? '#111' : 'var(--label-3)', boxShadow: a.earned ? `0 0 22px ${color}88` : 'none', overflow: 'hidden'
      }}>
        <Icon name={a.icon} />
        {a.earned && <span className="shine" />}
      </div>
    </div>
    <div className="small" style={{ fontWeight: 600, marginTop: 8, lineHeight: 1.2 }}>{t(a.title)}</div>
    <div className="small dim" style={{ fontSize: 11 }}>{a.earned ? t('Earned') : Math.round(a.p * 100) + '%'}</div>
  </motion.button>
}

export default function Awards() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const root = useRef(null)
  useShowcase(root)
  const awards = useMemo(() => awardsOf(S), [S])
  const earned = awards.filter(a => a.earned)

  useEffect(() => {
    const els = root.current.querySelectorAll('.badge')
    if (reducedMotion()) { gsap.set(els, { opacity: 1 }); return }
    const tw = gsap.fromTo(els, { opacity: 0, scale: 0.6, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: { each: 0.04, grid: 'auto', from: 'start' } })
    return () => tw.kill()
  }, [])

  // New awards since the last visit get a celebration.
  useEffect(() => {
    const seen = new Set(S.awardsSeen || [])
    const fresh = earned.filter(a => !seen.has(a.id))
    if (fresh.length) { celebrate(); update(s => { s.awardsSeen = earned.map(a => a.id) }) }
  }, [earned.length])

  return <div ref={root} className="narrow" style={{ position: 'relative' }}>
    <Spotlight />
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/you')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}>
        <TextReveal>{t('Awards')}</TextReveal>
        <div className="sub">{t('{0} of {1} earned', earned.length, awards.length)}</div>
      </div>
    </div>
    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px 10px', padding: '22px 12px' }}>
      {awards.map((a, i) => <Badge key={a.id} a={a} i={i} />)}
    </div>
    <div style={{ height: 24 }} />
  </div>
}
