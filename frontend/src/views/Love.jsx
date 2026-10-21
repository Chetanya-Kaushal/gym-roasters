import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import { SplitText } from 'gsap/SplitText'
import { t } from '../lib/i18n.js'
import { reducedMotion } from '../fx/motion.js'
import Icon from '../components/Icon.jsx'

gsap.registerPlugin(Physics2DPlugin, SplitText)

// Official video ("DEEWANIYAT Title Track", Play DMF / Vishal Mishra), embedded with YouTube's
// player on the privacy-enhanced domain — the song itself is not copied into the app.
const VIDEO = 'Qo4IOTAbGAM'
const COLORS = ['#ff4d6d', '#ff8fa3', '#ff2e63', '#ffb3c1', '#e5383b']
// Symmetric heart (both lobes mirror around x = 12), centred near (12, 12).
const heartPath = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z'

const Heart = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}><path d={heartPath} fill={color} /></svg>

// `onClose` set: shown as the intro overlay on every visit (App.jsx); otherwise the /love route.
export default function Love({ onClose }) {
  const nav = useNavigate()
  const root = useRef(null)
  const field = useRef(null)
  const big = useRef(null)
  const title = useRef(null)
  const [play, setPlay] = useState(false)

  // A beating heart, a headline that writes itself, and hearts drifting up like they're floating
  // on warm air: rise with a slow sideways sway and a little spin, fading near the top.
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.timeline({ repeat: -1, repeatDelay: 0.5 })
        .to(big.current, { scale: 1.18, duration: 0.14, ease: 'power2.out' })
        .to(big.current, { scale: 0.98, duration: 0.16, ease: 'power2.in' })
        .to(big.current, { scale: 1.12, duration: 0.12, ease: 'power2.out' })
        .to(big.current, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)' })
      const split = SplitText.create(title.current, { type: 'chars,words', mask: 'chars' })
      gsap.from(split.chars, { yPercent: 120, rotate: 8, opacity: 0, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.045, delay: 0.4 })
      // self-drawing heart outline, then a slow glow pulse
      const path = root.current.querySelector('.outline path'), L = path.getTotalLength()
      gsap.set(path, { strokeDasharray: L, strokeDashoffset: L })
      gsap.to(path, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', delay: 0.3 })
      gsap.to(path, { opacity: 0.35, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.7 })
      // small hearts orbiting the big one
      gsap.fromTo('.orbit', { rotation: 0, scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.6)', delay: 0.6 })
      gsap.to('.orbit', { rotation: 360, duration: 18, ease: 'none', repeat: -1 })
      // "Pari": shimmering gradient, a soft float and twinkling sparkles
      gsap.from('.pari', { scale: 0.4, opacity: 0, filter: 'blur(12px)', duration: 1.4, ease: 'elastic.out(1, 0.5)', delay: 1.3 })
      gsap.to('.pari', { backgroundPosition: '300% 0', duration: 6, ease: 'none', repeat: -1 })
      gsap.to('.pari', { y: -6, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.7 })
      gsap.utils.toArray('.spark').forEach((el, i) => gsap.to(el, { opacity: 1, scale: 1.8, duration: 0.5, yoyo: true, repeat: -1, repeatDelay: gsap.utils.random(0.6, 2), delay: 1.8 + i * 0.25, ease: 'sine.inOut' }))
      // rose petals falling, tumbling in 3D as they sway
      gsap.utils.toArray('.petal').forEach((el, i) => {
        const fall = () => {
          const w = root.current.clientWidth, h = root.current.clientHeight, d = gsap.utils.random(7, 13)
          gsap.set(el, { x: gsap.utils.random(0, w), y: -30, opacity: 0, rotation: gsap.utils.random(0, 360), rotationX: 0, transformPerspective: 400 })
          gsap.timeline({ onComplete: fall })
            .to(el, { y: h + 30, duration: d, ease: 'none' })
            .to(el, { opacity: 0.85, duration: 1 }, 0)
            .to(el, { x: `+=${gsap.utils.random(-90, 90)}`, duration: d / 4, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0)
            .to(el, { rotationX: 720, rotation: `+=${gsap.utils.random(-200, 200)}`, duration: d, ease: 'none' }, 0)
        }
        gsap.delayedCall(1 + i * 0.6, fall)
      })
      const els = gsap.utils.toArray('.float-heart', field.current)
      els.forEach((el, i) => {
        const h = field.current.clientHeight
        const run = () => {
          gsap.set(el, { x: gsap.utils.random(0, field.current.clientWidth), y: h + 40, opacity: 0, scale: gsap.utils.random(0.5, 1.3), rotation: gsap.utils.random(-25, 25) })
          const d = gsap.utils.random(6, 11)
          gsap.timeline({ onComplete: run })
            .to(el, { y: -60, duration: d, ease: 'none' })
            .to(el, { opacity: gsap.utils.random(0.5, 0.95), duration: 1 }, 0)
            .to(el, { x: `+=${gsap.utils.random(-60, 60)}`, duration: d / 3, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0)
            .to(el, { rotation: `+=${gsap.utils.random(-40, 40)}`, duration: d, ease: 'sine.inOut' }, 0)
            .to(el, { opacity: 0, duration: 1.5 }, d - 1.5)
        }
        gsap.delayedCall(i * 0.35, run)
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // Tap anywhere: a burst of hearts thrown out under real gravity.
  const burst = e => {
    if (reducedMotion()) return
    const b = root.current.getBoundingClientRect()
    const x = (e.clientX ?? b.width / 2) - b.left, y = (e.clientY ?? b.height / 2) - b.top
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div')
      el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="${heartPath}" fill="${gsap.utils.random(COLORS)}"/></svg>`
      Object.assign(el.style, { position: 'absolute', left: x - 11 + 'px', top: y - 11 + 'px', pointerEvents: 'none', zIndex: 5 })
      root.current.appendChild(el)
      gsap.to(el, {
        duration: 2.2, physics2D: { velocity: gsap.utils.random(220, 520), angle: gsap.utils.random(-160, -20), gravity: 650 },
        rotation: gsap.utils.random(-360, 360), scale: gsap.utils.random(0.6, 1.4), opacity: 0, ease: 'none', onComplete: () => el.remove()
      })
    }
    gsap.fromTo(big.current, { scale: 1.3 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
  }

  return <div ref={root} className="narrow" onClick={burst} style={{ position: 'relative', minHeight: '86vh', overflow: 'hidden', textAlign: 'center' }}>
    <div ref={field} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 22 }, (_, i) => <div key={i} className="float-heart" style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
        <Heart size={18 + (i % 4) * 8} color={COLORS[i % COLORS.length]} />
      </div>)}
    </div>
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {Array.from({ length: 14 }, (_, i) => <div key={i} className="petal" style={{ position: 'absolute', left: 0, top: 0, width: 14, height: 18, opacity: 0,
        borderRadius: '80% 0 80% 0', background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, #8b0a2a)` }} />)}
    </div>
    <div className="hdr" style={{ position: 'relative', zIndex: 2 }}>
      <button className="iconbtn" onClick={e => { e.stopPropagation(); onClose ? onClose() : nav('/home') }} aria-label={t('Close')}><Icon name="xmark" /></button>
    </div>
    <div style={{ position: 'relative', zIndex: 2, paddingTop: 10 }}>
      <div style={{ position: 'relative', width: 220, height: 200, margin: '0 auto' }}>
        <div className="orbit" aria-hidden style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: `rotate(${i * 45}deg) translateY(-96px) rotate(${-i * 45}deg)`, marginLeft: -7, marginTop: -7 }}>
            <Heart size={14} color={COLORS[i % COLORS.length]} />
          </div>)}
        </div>
        {/* filled heart and its self-drawing outline share one SVG, so they stay perfectly aligned */}
        <div ref={big} style={{ position: 'absolute', left: 10, top: 0, width: 200, height: 200, filter: 'drop-shadow(0 10px 30px rgba(255,46,99,.55))' }}>
          <svg width="200" height="200" viewBox="-1 -1 26 26" style={{ overflow: 'visible' }}>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8fa3" /><stop offset="1" stopColor="#e5383b" /></linearGradient></defs>
            <g className="outline" transform="translate(12 12.2) scale(1.18) translate(-12 -12.2)">
              <path d={heartPath} fill="none" stroke="#ffb3c1" strokeWidth="0.32" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <path d={heartPath} fill="url(#lg)" transform="translate(12 12.2) scale(0.86) translate(-12 -12.2)" />
          </svg>
        </div>
      </div>
      <h1 ref={title} style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.03em', margin: '18px 0 6px', lineHeight: 1.15 }}>{t('This is for you,')}</h1>
      <div style={{ position: 'relative', display: 'inline-block', margin: '0 0 8px' }}>
        <div className="pari" style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-.02em', fontFamily: '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive',
          background: 'linear-gradient(90deg,#ff8fa3,#ff2e63,#ffb3c1,#ff2e63)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Pari ❤️</div>
        {Array.from({ length: 7 }, (_, i) => <span key={i} className="spark" aria-hidden style={{ position: 'absolute', left: `${8 + i * 14}%`, top: `${i % 2 ? -8 : 78}%`, width: 8, height: 8, opacity: 0,
          background: 'radial-gradient(circle,#fff,#ffd1dc 40%,transparent 70%)', borderRadius: '50%' }} />)}
      </div>
      <div className="muted" style={{ marginBottom: 22 }}>{t('Tap anywhere for more love')}</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 auto', maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        {play
          ? <iframe title="Deewaniyat" width="100%" style={{ aspectRatio: '16/9', display: 'block', border: 0 }}
            src={`https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1&playsinline=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          : <button onPointerDown={() => setPlay(true)} onClick={() => setPlay(true)} style={{ width: '100%', aspectRatio: '16/9', border: 0, cursor: 'pointer', color: '#fff', position: 'relative',
            background: `center/cover no-repeat url(https://i.ytimg.com/vi/${VIDEO}/mqdefault.jpg)` }} aria-label={t('Play Deewaniyat')}>
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.7))' }} />
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ff2e63', borderRadius: 999, padding: '12px 20px', fontWeight: 700 }}>
              <Icon name="play" /> Deewaniyat
            </span>
          </button>}
        <div className="row between" style={{ padding: '8px 12px' }}>
          <span className="small dim" style={{ textAlign: 'left' }}>Deewaniyat · Vishal Mishra · Ek Deewane Ki Deewaniyat</span>
          {/* removing the player is the one stop that works everywhere, iOS included */}
          {play && <button className="tag" style={{ cursor: 'pointer', background: '#ff2e63', color: '#fff', flex: 'none' }} onClick={() => setPlay(false)}>
            <Icon name="pause" /> {t('Stop song')}
          </button>}
        </div>
      </div>
    </div>
  </div>
}
