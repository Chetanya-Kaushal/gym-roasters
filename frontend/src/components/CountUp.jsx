import { useEffect, useRef } from 'react'
import { animate } from 'motion/react'
import { reducedMotion } from '../fx/motion.js'

// A number that counts up to its value when it first appears or changes.
export default function CountUp({ value, decimals = 0, duration = 1.1 }) {
  const ref = useRef(null)
  const from = useRef(0)
  useEffect(() => {
    const el = ref.current
    const fmt = v => v.toFixed(decimals)
    if (!el) return
    if (reducedMotion()) { el.textContent = fmt(value); from.current = value; return }
    const ctl = animate(from.current, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: v => { el.textContent = fmt(v) } })
    from.current = value
    return () => ctl.stop()
  }, [value, decimals, duration])
  return <span ref={ref}>{(0).toFixed(decimals)}</span>
}
