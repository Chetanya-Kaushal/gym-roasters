// "Share my day": draws today's rings and numbers onto a 1080×1920 story image and hands it to
// the phone's share sheet (Instagram, WhatsApp, …), or downloads it where sharing files isn't
// supported.
import { RING_COLORS } from '../components/Rings.jsx'
import { t, dateLocale } from './i18n.js'

export async function shareDayCard(S, a) {
  const W = 1080, H = 1920
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b0d12'); bg.addColorStop(1, '#1b1030')
  g.fillStyle = bg; g.fillRect(0, 0, W, H)

  const font = (w, s) => `${w} ${s}px -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif`
  g.fillStyle = '#fff'; g.textAlign = 'center'
  g.font = font(800, 76); g.fillText('Gym Roasters', W / 2, 200)
  g.font = font(500, 40); g.fillStyle = 'rgba(255,255,255,.65)'
  g.fillText(new Date(a.iso + 'T12:00:00').toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }), W / 2, 270)

  // rings
  const cx = W / 2, cy = 760, sw = 78, gap = 14
  ;[a.move.p, a.exercise.p, a.hydrate.p].forEach((p, i) => {
    const r = 330 - i * (sw + gap)
    g.lineWidth = sw; g.lineCap = 'round'
    g.strokeStyle = RING_COLORS[i] + '30'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke()
    const v = Math.min(1, p)
    if (v > 0) { g.strokeStyle = RING_COLORS[i]; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); g.stroke() }
  })

  const rows = [
    [t('Move'), `${a.move.v}/${a.move.goal} kcal`, 0],
    [t('Exercise'), `${a.exercise.v}/${a.exercise.goal} min`, 1],
    [t('Water'), `${(a.hydrate.v / 1000).toFixed(1)}/${(a.hydrate.goal / 1000).toFixed(1)} L`, 2]
  ]
  rows.forEach(([l, v, i], k) => {
    const y = 1260 + k * 150
    g.textAlign = 'left'; g.fillStyle = RING_COLORS[i]; g.font = font(600, 44); g.fillText(l, 140, y)
    g.textAlign = 'right'; g.font = font(800, 64); g.fillText(v, W - 140, y)
  })
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.55)'; g.font = font(500, 36)
  g.fillText(`${a.steps.toLocaleString()} ${t('steps')} · gym-roasters.vercel.app`, W / 2, 1800)

  const blob = await new Promise(r => c.toBlob(r, 'image/png'))
  const file = new File([blob], 'gym-roasters-day.png', { type: 'image/png' })
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Gym Roasters' }); return }
  } catch (e) { if (e.name === 'AbortError') return }
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: file.name })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
