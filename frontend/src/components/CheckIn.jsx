import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { uid, todayISO } from '../lib/format.js'
import { dayActivity } from '../lib/activity.js'
import { nav } from '../lib/nav.js'
import { Button } from './ui.jsx'
import CountUp from './CountUp.jsx'

// Daily water & protein check-in. Home opens it once in the morning (after 10:00) and again in
// the evening (after 18:00) if a goal is still open; the slot is remembered in S.checkin.
export function checkinSlot(S, now = new Date()) {
  const prof = S.profile && !S.profile.skipped
  if (!prof) return null
  const iso = todayISO(), h = now.getHours()
  const slot = h >= 18 ? 'pm' : h >= 10 ? 'am' : null
  if (!slot || (S.checkin || '') >= iso + ':' + slot) return null
  if (slot === 'pm') {
    const a = dayActivity(S, iso)
    if (a.hydrate.p >= 1 && (!a.protein || a.protein.p >= 1)) return null
  }
  return slot
}

export default function CheckIn({ slot, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const iso = todayISO()
  const a = dayActivity(S, iso)
  const water = n => update(s => { s.water = s.water || {}; s.water[iso] = Math.max(0, (s.water[iso] || 0) + n) })
  const protein = g => update(s => {
    s.food = s.food || {}; s.food[iso] = s.food[iso] || []
    s.food[iso].push({ id: uid(), n: t('Protein (quick add)'), kcal: g * 4, p: g, c: 0, f: 0, q: 1 })
  })
  const done = () => { update(s => { s.checkin = iso + ':' + slot }); close() }
  return <>
    <h3>{slot === 'am' ? t('Good morning! Quick check-in') : t('Evening check-in')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('How much water and protein have you had today?')}</div>
    <div className="row between"><b>{t('Water')}</b><span style={{ fontSize: 22, fontWeight: 700, color: '#38d0ff' }}><CountUp value={a.hydrate.v / 1000} decimals={2} /> / {(a.hydrate.goal / 1000).toFixed(1)} L</span></div>
    <div className="row" style={{ gap: 8, margin: '8px 0 18px' }}>
      <Button size="sm" onClick={() => water(-250)}>−250</Button>
      <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => water(250)}>+250 ml</Button>
      <Button size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => water(500)}>+500 ml</Button>
    </div>
    {a.protein && <>
      <div className="row between"><b>{t('Protein')}</b><span style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)' }}><CountUp value={a.food.p} /> / {a.protein.goal} g</span></div>
      <div className="row" style={{ gap: 8, margin: '8px 0 6px' }}>
        {[10, 20, 30].map(g => <Button key={g} size="sm" variant="tinted" style={{ flex: 1 }} onClick={() => protein(g)}>+{g} g</Button>)}
      </div>
      <div className="small dim" style={{ marginBottom: 14 }}>{t('{0} g still to go — a cup of dal ≈ 18 g, 100 g paneer ≈ 18 g, 3 eggs ≈ 19 g, a scoop of whey ≈ 24 g.', Math.max(0, a.protein.goal - a.food.p))}</div>
    </>}
    <div className="row" style={{ gap: 8 }}>
      <Button style={{ flex: 1 }} onClick={() => { done(); nav('/food') }}>{t('Log a meal')}</Button>
      <Button variant="primary" style={{ flex: 1 }} onClick={done}>{t('Done')}</Button>
    </div>
  </>
}
