import { motion } from 'motion/react'
import { reducedMotion } from '../fx/motion.js'

// The three activity rings: Move, Exercise, Water. Progress past 100% keeps the ring full and
// adds a brighter overlap lap, so an overachieving day still reads as more than "done".
export const RING_COLORS = ['#ff4d6d', '#b7f34a', '#38d0ff']

export default function Rings({ values, size = 180, stroke, delay = 0, label }) {
  const sw = stroke || Math.max(6, size * 0.11)
  const gap = sw * 0.18
  const still = reducedMotion()
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} style={{ display: 'block' }}>
    {values.map((p, i) => {
      const r = size / 2 - sw / 2 - i * (sw + gap)
      if (r <= sw / 2) return null
      const c = RING_COLORS[i]
      const lap1 = Math.min(1, Math.max(0, p || 0))
      const lap2 = Math.min(1, Math.max(0, (p || 0) - 1))
      const common = { cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: sw, strokeLinecap: 'round', style: { transform: 'rotate(-90deg)', transformOrigin: 'center' } }
      return <g key={i}>
        <circle {...common} stroke={c} opacity={0.18} />
        {lap1 > 0 && <motion.circle {...common} stroke={c}
          initial={{ pathLength: still ? lap1 : 0 }} animate={{ pathLength: lap1 }}
          transition={{ type: 'spring', stiffness: 40, damping: 14, delay: delay + i * 0.12 }} />}
        {lap2 > 0 && <motion.circle {...common} stroke={c} style={{ ...common.style, filter: 'brightness(1.35) drop-shadow(0 0 3px rgba(0,0,0,.6))' }}
          initial={{ pathLength: still ? lap2 : 0 }} animate={{ pathLength: lap2 }}
          transition={{ type: 'spring', stiffness: 40, damping: 14, delay: delay + 0.6 + i * 0.12 }} />}
      </g>
    })}
  </svg>
}
