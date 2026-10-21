import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import Rings from '../components/Rings.jsx'
import Icon from '../components/Icon.jsx'
import { Button, TextField } from '../components/ui.jsx'
import { confirmSheet } from '../sheets.jsx'
import { TextReveal } from '../fx/showcase.jsx'
import { celebrate } from '../fx/motion.js'

// Sharing: friends' rings at a glance and 7-day competitions (signed-in, hosted app only).
export default function Social() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const toast = useUI(s => s.toast)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [code, setCode] = useState('')
  const load = () => api('/api/social').then(setData).catch(e => setErr(e.status === 404 ? t('Sharing needs the hosted app with sign-in.') : e.message))
  useEffect(() => { if (user) load() }, [user])

  const add = async () => {
    try { await api('/api/social/add', { method: 'POST', body: JSON.stringify({ code }) }); setCode(''); toast(t('Friend added')); celebrate({ particleCount: 50 }); load() }
    catch (e) { toast(e.message) }
  }
  const compete = async id => {
    try { await api('/api/social/compete', { method: 'POST', body: JSON.stringify({ id }) }); toast(t('Competition started — 7 days, may the best rings win!')); load() }
    catch (e) { toast(e.message) }
  }
  const remove = f => confirmSheet({ title: t('Remove {0}?', f.name), message: t('You will stop seeing each other’s activity.'), confirmText: t('Remove'), danger: true,
    onConfirm: async () => { await api('/api/social/remove', { method: 'POST', body: JSON.stringify({ id: f.id }) }).catch(() => {}); load() } })
  const share = () => {
    const text = t('Add me on Gym Roasters with code {0} and let’s close our rings together! https://gym-roasters.vercel.app', data.code)
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text).then(() => toast(t('Copied')))
  }
  const sum = xs => xs.reduce((a, b) => a + b, 0)

  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/you')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><TextReveal>{t('Sharing')}</TextReveal><div className="sub">{t('Friends, rings and competitions')}</div></div>
    </div>
    {!user ? <div className="card muted">{t('Sign in with a passkey to add friends and compete.')}</div>
      : err ? <div className="card muted">{err}</div>
        : !data ? <div className="card dim">{t('Loading…')}</div> : <>
          <div className="card">
            <div className="small dim">{t('Your friend code')}</div>
            <div className="row between"><div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '.12em' }}>{data.code}</div>
              <Button size="sm" variant="tinted" icon="upload" onClick={share}>{t('Invite')}</Button></div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <TextField value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t('Friend’s code')} maxLength={6} style={{ flex: 1, letterSpacing: '.1em' }} />
              <Button size="sm" variant="primary" disabled={code.length < 6} onClick={add}>{t('Add')}</Button>
            </div>
            <div className="small dim" style={{ marginTop: 8 }}>{t('Friends see only your ring progress and competition points — never your workouts, food or body data.')}</div>
          </div>

          {data.comps.length > 0 && <div className="card">
            <h2 style={{ marginTop: 0 }}>{t('Competitions')}</h2>
            {data.comps.map(c => {
              const me = sum(c.me), them = sum(c.them), max = Math.max(1, me, them)
              return <div key={c.id} style={{ marginBottom: 12 }}>
                <div className="row between small"><b>{t('You vs {0}', c.with)}</b><span className="dim">{c.start} → {c.finish}</span></div>
                {[[t('You'), me, '#b7f34a'], [c.with, them, '#ff4d6d']].map(([n, v, col]) => <div key={n} className="row" style={{ gap: 8, marginTop: 6 }}>
                  <span className="small" style={{ width: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span>
                  <div style={{ flex: 1, height: 12, background: 'var(--surface-3)', borderRadius: 6, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: (v / max) * 100 + '%' }} transition={{ type: 'spring', stiffness: 60, damping: 15 }} style={{ height: '100%', background: col }} />
                  </div>
                  <b className="small" style={{ width: 44, textAlign: 'right' }}>{v}</b>
                </div>)}
              </div>
            })}
          </div>}

          <div className="card">
            <h2 style={{ marginTop: 0 }}>{t('Friends')}</h2>
            {!data.friends.length && <div className="small muted">{t('Share your code to add your first friend.')}</div>}
            <AnimatePresence>{data.friends.map(f => <motion.div key={f.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="row" style={{ gap: 12, padding: '8px 0', borderTop: '1px solid var(--sep)' }}>
              <Rings values={f.today} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{f.name}</div>
                <div className="small dim">{t('Move {0}% · Exercise {1}% · Water {2}%', Math.round(f.today[0] * 100), Math.round(f.today[1] * 100), Math.round(f.today[2] * 100))}</div>
              </div>
              <button className="iconbtn" aria-label={t('Compete')} title={t('Compete')} onClick={() => compete(f.id)}><Icon name="trophy" /></button>
              <button className="iconbtn" aria-label={t('Remove')} onClick={() => remove(f)}><Icon name="xmark" /></button>
            </motion.div>)}</AnimatePresence>
          </div>
        </>}
    <div style={{ height: 24 }} />
  </div>
}
