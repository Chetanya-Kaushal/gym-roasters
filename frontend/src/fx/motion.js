// Shared animation helpers. Everything here checks the phone's "Reduce Motion" setting first.
export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Confetti burst (canvas-confetti, loaded on demand so it never weighs on first paint).
export async function celebrate(opts = {}) {
  if (reducedMotion()) return
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['#ff4d6d', '#b7f34a', '#38d0ff', '#ffd166']
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.35 }, colors, ...opts })
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors }), 180)
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors }), 300)
}
