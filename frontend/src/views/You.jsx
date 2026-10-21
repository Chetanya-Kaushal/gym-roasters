import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { t, dateLocale } from '../lib/i18n.js'
import { todayISO } from '../lib/format.js'
import { dayActivity, closed, streak, lastDays, awardsOf } from '../lib/activity.js'
import Rings, { RING_COLORS } from '../components/Rings.jsx'
import CountUp from '../components/CountUp.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { useShowcase, TextReveal, Spotlight } from '../fx/showcase.jsx'
import { celebrate } from '../fx/motion.js'
import { shareDayCard } from '../lib/sharecard.js'

const tap = { whileTap: { scale: 0.96 }, whileHover: { y: -2 } }

// The activity hub: today's rings, streaks, quick logs and the way into awards, body,
// timers, stats and the exercise library.
export default function You() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const root = useRef(null)
  useShowcase(root)
  const today = todayISO()
  const a = dayActivity(S, today)
  const week = lastDays(7).map(d => dayActivity(S, d))
  const moveStreak = streak(S, x => x.move.p >= 1)
  const awards = useMemo(() => awardsOf(S), [S])
  const won = awards.filter(x => x.earned).length

  // Confetti once per day, the first time all three rings close.
  useEffect(() => {
    if (closed(a) && S.celebrated !== today) { celebrate(); update(s => { s.celebrated = today }) }
  }, [closed(a), today])

  const steps = a.steps, sleep = (S.sleep || {})[today]
  const addSteps = n => update(s => { s.steps = s.steps || {}; s.steps[today] = Math.max(0, (s.steps[today] || 0) + n) })
  const setSleep = h => update(s => { s.sleep = s.sleep || {}; s.sleep[today] = { ...(s.sleep[today] || {}), h: Math.max(0, Math.min(14, h)) } })
  const rows = [
    ['Move', a.move.v, a.move.goal, 'kcal', 0],
    ['Exercise', a.exercise.v, a.exercise.goal, 'min', 1],
    ['Water', +(a.hydrate.v / 1000).toFixed(1), +(a.hydrate.goal / 1000).toFixed(1), 'L', 2]
  ]
  const tiles = [
    ['trophy', 'Awards', `${won}/${awards.length}`, '/awards'],
    ['scale', 'Body & sleep', t('Measurements, photos'), '/body'],
    ['timer', 'Timers', t('HIIT, warm-up, stretch'), '/timer'],
    ['chart', 'Stats', t('Charts & records'), '/stats'],
    ['list', 'Exercises', t('1,324 with demos'), '/library'],
    ['upload', 'Share my day', t('Image for your story'), null]
  ]

  return <div ref={root} className="narrow" style={{ position: 'relative' }}>
    <Spotlight />
    <div className="hdr">
      <div style={{ flex: 1 }}>
        <TextReveal>{t('Activity')}</TextReveal>
        <div className="sub">{new Date().toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
    </div>

    <div className="card" data-reveal style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div data-parallax="-10"><Rings values={[a.move.p, a.exercise.p, a.hydrate.p]} size={168} label={t('Activity rings')} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {rows.map(([name, v, goal, unit, i]) => <div key={name} style={{ marginBottom: 10 }}>
          <div className="small" style={{ color: RING_COLORS[i], fontWeight: 600 }}>{t(name)}</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: RING_COLORS[i] }}>
            <CountUp value={v} decimals={unit === 'L' ? 1 : 0} /><span style={{ fontSize: 14, opacity: 0.8 }}>/{goal} {unit}</span>
          </div>
        </div>)}
      </div>
    </div>

    <div className="card" data-reveal>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{t('This week')}</h2>
        <span className="tag acc"><Icon name="flame" />{t('{0}-day streak', moveStreak)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', justifyItems: 'center' }}>
        {week.map((d, i) => <div key={d.iso} style={{ textAlign: 'center' }}>
          <Rings values={[d.move.p, d.exercise.p, d.hydrate.p]} size={34} delay={i * 0.05} />
          <div className="small dim" style={{ marginTop: 4 }}>{new Date(d.iso + 'T12:00:00').toLocaleDateString(dateLocale(), { weekday: 'narrow' })}</div>
        </div>)}
      </div>
    </div>

    <div className="card" data-reveal>
      <div className="row between"><b>{t('Steps')}</b><span style={{ fontSize: 22, fontWeight: 700 }}><CountUp value={steps} /></span></div>
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <Button size="sm" onClick={() => addSteps(-1000)}>−1k</Button>
        <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => addSteps(1000)}>+1,000</Button>
        <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => addSteps(5000)}>+5,000</Button>
      </div>
      <div className="row between" style={{ marginTop: 16 }}><b>{t('Sleep last night')}</b><span style={{ fontSize: 22, fontWeight: 700 }}>{sleep?.h ?? '—'} h</span></div>
      <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {[5, 6, 7, 8, 9].map(h => <motion.button key={h} {...tap} className={'chip' + (sleep?.h === h ? ' on' : '')} style={{ textTransform: 'none' }} onClick={() => setSleep(h)}>{h} h</motion.button>)}
      </div>
      <div className="dim small" style={{ marginTop: 8 }}>{t('Adults need 7–9 hours. Steps count toward your Move ring.')}</div>
    </div>

    <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
      {tiles.map(([icon, title, sub, to]) => <motion.button key={title} {...tap} className="card" style={{ textAlign: 'left', margin: 0, cursor: 'pointer' }}
        onClick={() => to ? nav(to) : shareDayCard(S, a)}>
        <span className="lrow-i" style={{ marginBottom: 8 }}><Icon name={icon} /></span>
        <div style={{ fontWeight: 600 }}>{t(title)}</div>
        <div className="small dim">{sub}</div>
      </motion.button>)}
    </div>

    <WeekSummary S={S} week={week} />
    <div style={{ height: 24 }} />
  </div>
}

function WeekSummary({ S, week }) {
  const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const isos = new Set(week.map(d => d.iso))
  const workouts = (S.workouts || []).filter(w => isos.has(w.d)).length
  const sleeps = week.map(d => (S.sleep || {})[d.iso]?.h).filter(Boolean)
  const eaten = week.filter(d => d.food.kcal > 0)
  const bw = (S.bodyweight || []).filter(b => isos.has(b.d))
  const items = [
    ['Workouts', workouts],
    ['Active kcal', week.reduce((n, d) => n + d.move.v, 0)],
    ['Avg steps', Math.round(avg(week.map(d => d.steps)))],
    ['Avg sleep', sleeps.length ? avg(sleeps).toFixed(1) + ' h' : '—'],
    ['Avg kcal eaten', eaten.length ? Math.round(avg(eaten.map(d => d.food.kcal))) : '—'],
    ['Weight change', bw.length > 1 ? (bw[bw.length - 1].w - bw[0].w > 0 ? '+' : '') + (bw[bw.length - 1].w - bw[0].w).toFixed(1) + ' ' + S.unit : '—']
  ]
  return <div className="card" data-reveal>
    <h2>{t('Weekly summary')}</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {items.map(([l, v]) => <div key={l}><div style={{ fontSize: 19, fontWeight: 700 }}>{v}</div><div className="small dim">{t(l)}</div></div>)}
    </div>
  </div>
}
