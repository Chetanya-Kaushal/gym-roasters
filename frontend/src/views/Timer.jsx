import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { beep, vibrate } from '../lib/sound.js'
import { useWakeLock } from '../lib/wakelock.js'
import Icon from '../components/Icon.jsx'
import { Button, Stepper, Switch } from '../components/ui.jsx'

// Guided interval timers. Phases are [label, seconds, kind]; work/rest drive the colour.
const intervals = (work, rest, rounds, name = 'Work') => Array.from({ length: rounds }, (_, i) => [
  [`${t(name)} ${i + 1}/${rounds}`, work, 'work'], ...(rest && i < rounds - 1 ? [[t('Rest'), rest, 'rest']] : [])
]).flat()
const guided = list => list.flatMap(([n, s], i) => [[t(n), s, 'work'], ...(i < list.length - 1 ? [[t('Next: {0}', t(list[i + 1][0])), 10, 'rest']] : [])])

const PRESETS = [
  ['tabata', 'Tabata', '20 s on · 10 s off · 8 rounds', () => intervals(20, 10, 8)],
  ['hiit', 'HIIT 40/20', '40 s on · 20 s off · 10 rounds', () => intervals(40, 20, 10)],
  ['emom', 'EMOM 10', 'A new set every minute for 10 min', () => intervals(60, 0, 10, 'Minute')],
  ['warmup', 'Warm-up', '5 min dynamic warm-up before lifting', () => guided([
    ['Jumping jacks', 45], ['Arm circles', 30], ['Bodyweight squats', 45], ['Hip openers', 30], ['Inchworms', 45], ['Glute bridges', 45]])],
  ['stretch', 'Cool-down stretch', '5 min stretch after training', () => guided([
    ['Hamstring stretch', 40], ['Quad stretch — left', 30], ['Quad stretch — right', 30], ['Chest stretch', 40], ['Hip flexor stretch — left', 30], ['Hip flexor stretch — right', 30], ["Child's pose", 45]])]
]
const COL = { work: '#b7f34a', rest: '#38d0ff' }

function speak(on, text) {
  if (!on || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 1.05 }))
}

export default function Timer() {
  const nav = useNavigate()
  const sound = useStore(s => s.S.sound !== false)
  const [custom, setCustom] = useState({ work: 30, rest: 15, rounds: 8 })
  const [voice, setVoice] = useState(true)
  const [run, setRun] = useState(null)   // { title, phases, i, endsAt, paused, left }
  const [, force] = useState(0)
  const said = useRef(-1)
  useWakeLock(!!run && !run.paused)

  const start = (title, phases) => { said.current = -1; setRun({ title, phases, i: 0, endsAt: Date.now() + phases[0][1] * 1000, paused: false }) }

  useEffect(() => {
    if (!run || run.paused) return
    const id = setInterval(() => {
      const left = Math.ceil((run.endsAt - Date.now()) / 1000)
      if (said.current !== run.i) { said.current = run.i; speak(voice, run.phases[run.i][0]) }
      if (left <= 3 && left > 0) beep(sound, 660, 0.08)
      if (left <= 0) {
        const n = run.i + 1
        if (n >= run.phases.length) { beep(sound, 880, 0.2); beep(sound, 1320, 0.35, 0.22); vibrate([200, 80, 200]); speak(voice, t('Done. Great work!')); setRun(r => ({ ...r, done: true, paused: true })); return }
        beep(sound, run.phases[n][2] === 'work' ? 1100 : 520, 0.2); vibrate(150)
        setRun(r => ({ ...r, i: n, endsAt: Date.now() + r.phases[n][1] * 1000 }))
      } else force(x => x + 1)
    }, 250)
    return () => clearInterval(id)
  }, [run, voice, sound])

  if (run) {
    const [label, sec, kind] = run.phases[run.i]
    const left = run.paused ? (run.left ?? sec) : Math.max(0, Math.ceil((run.endsAt - Date.now()) / 1000))
    const p = run.done ? 1 : 1 - left / sec
    const total = run.phases.reduce((n, x) => n + x[1], 0), doneSec = run.phases.slice(0, run.i).reduce((n, x) => n + x[1], 0) + (sec - left)
    const R = 120, C = 2 * Math.PI * R
    return <div className="narrow" style={{ textAlign: 'center' }}>
      <div className="hdr">
        <button className="iconbtn" onClick={() => { speechSynthesis?.cancel(); setRun(null) }} aria-label={t('Close')}><Icon name="xmark" /></button>
        <div style={{ flex: 1 }}><h1 style={{ fontSize: 22 }}>{run.title}</h1></div>
      </div>
      <div style={{ position: 'relative', width: 280, height: 280, margin: '10px auto 18px' }}>
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="16" />
          <circle cx="140" cy="140" r={R} fill="none" stroke={run.done ? COL.work : COL[kind]} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset .25s linear, stroke .3s' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div key={run.done ? 'done' : left} initial={{ scale: 1.25, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' }}>
              {run.done ? '✓' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
            </motion.div>
          </AnimatePresence>
          <div style={{ color: COL[kind], fontWeight: 600, padding: '0 30px' }}>{run.done ? t('Done!') : label}</div>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: '100%', width: (doneSec / total) * 100 + '%', background: 'var(--acc)', transition: 'width .25s linear' }} />
      </div>
      {!run.done && <div className="row" style={{ gap: 10 }}>
        <Button style={{ flex: 1 }} icon={run.paused ? 'play' : 'pause'} variant="primary" onClick={() => setRun(r => r.paused
          ? { ...r, paused: false, endsAt: Date.now() + (r.left ?? r.phases[r.i][1]) * 1000 }
          : { ...r, paused: true, left: Math.max(1, Math.ceil((r.endsAt - Date.now()) / 1000)) })}>{run.paused ? t('Resume') : t('Pause')}</Button>
        <Button style={{ flex: 1 }} icon="chevronRight" onClick={() => setRun(r => r.i + 1 < r.phases.length ? { ...r, i: r.i + 1, left: undefined, endsAt: Date.now() + r.phases[r.i + 1][1] * 1000 } : r)}>{t('Skip')}</Button>
      </div>}
      {run.done && <Button variant="primary" onClick={() => setRun(null)}>{t('Finish')}</Button>}
    </div>
  }

  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/you')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><h1>{t('Timers')}</h1><div className="sub">{t('Voice and beep cues, screen stays on')}</div></div>
    </div>
    <div className="list" style={{ marginBottom: 16 }}>
      {PRESETS.map(([id, title, sub, build]) => <motion.div key={id} className="item" whileTap={{ scale: 0.98 }} onClick={() => start(t(title), build())}>
        <span className="lrow-i"><Icon name={id === 'stretch' ? 'stretch' : id === 'warmup' ? 'flame' : 'timer'} /></span>
        <div className="grow"><div className="tt">{t(title)}</div><div className="ss">{t(sub)}</div></div>
        <Icon name="play" className="chev" />
      </motion.div>)}
    </div>
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t('Custom intervals')}</h2>
      <div className="row cfgrow" style={{ marginBottom: 14 }}>
        <Stepper label={t('Work (s)')} value={custom.work} step={5} decimal={false} onChange={v => setCustom(c => ({ ...c, work: Math.max(5, v) }))} />
        <Stepper label={t('Rest (s)')} value={custom.rest} step={5} decimal={false} onChange={v => setCustom(c => ({ ...c, rest: Math.max(0, v) }))} />
        <Stepper label={t('Rounds')} value={custom.rounds} step={1} decimal={false} onChange={v => setCustom(c => ({ ...c, rounds: Math.max(1, v) }))} />
      </div>
      <Button variant="primary" icon="play" onClick={() => start(t('Custom intervals'), intervals(custom.work, custom.rest, custom.rounds))}>{t('Start')}</Button>
    </div>
    <div className="card row between"><span>{t('Voice cues')}</span><Switch checked={voice} onChange={setVoice} /></div>
    <div style={{ height: 24 }} />
  </div>
}
