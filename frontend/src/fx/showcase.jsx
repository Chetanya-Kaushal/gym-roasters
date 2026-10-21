// Showcase-screen effects: Lenis smooth scrolling, GSAP ScrollTrigger reveals and parallax,
// SplitText headline reveals, and a cursor spotlight on desktop. Used on the onboarding,
// You (activity), Awards and Body screens only — the workout screen stays plain and fast.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { reducedMotion } from './motion.js'

gsap.registerPlugin(ScrollTrigger, SplitText)

// Smooth scroll + reveal of every [data-reveal] child + parallax on [data-parallax].
export function useShowcase(rootRef) {
  useEffect(() => {
    if (reducedMotion()) return
    let lenis, tick
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      tick = t => lenis.raf(t * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    })
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 92%',
        onEnter: els => gsap.fromTo(els, { y: 28, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true })
      })
      gsap.utils.toArray('[data-parallax]').forEach(el => {
        gsap.to(el, { yPercent: +el.dataset.parallax || -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
      })
    }, rootRef)
    return () => { ctx.revert(); if (tick) gsap.ticker.remove(tick); lenis?.destroy() }
  }, [rootRef])
}

// Headline whose characters rise in one by one.
export function TextReveal({ as: Tag = 'h1', children, delay = 0, ...rest }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    if (reducedMotion() || !ref.current) return
    const split = SplitText.create(ref.current, { type: 'words,chars', mask: 'chars' })
    const tw = gsap.from(split.chars, { yPercent: 110, opacity: 0, duration: 0.7, ease: 'power4.out', stagger: 0.022, delay })
    return () => { tw.kill(); split.revert() }
  }, [children, delay])
  return <Tag ref={ref} {...rest}>{children}</Tag>
}

// Soft glow that follows the mouse on desktop (pointer: fine); nothing on touch screens.
export function Spotlight() {
  const ref = useRef(null)
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const el = ref.current
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
    const move = e => { x(e.clientX - 160); y(e.clientY - 160) }
    window.addEventListener('pointermove', move)
    el.style.opacity = 1
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return <div ref={ref} aria-hidden style={{
    position: 'fixed', left: 0, top: 0, width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, opacity: 0,
    background: 'radial-gradient(circle, color-mix(in srgb, var(--acc) 22%, transparent) 0%, transparent 65%)', mixBlendMode: 'screen'
  }} />
}

// 3D tilt toward the pointer, for cards and badges.
export function useTilt(ref, max = 12) {
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    gsap.set(el, { transformPerspective: 600 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4 }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.4 })
    const move = e => { const b = el.getBoundingClientRect(); ry(((e.clientX - b.left) / b.width - 0.5) * max * 2); rx(-((e.clientY - b.top) / b.height - 0.5) * max * 2) }
    const leave = () => { rx(0); ry(0) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [ref, max])
}
