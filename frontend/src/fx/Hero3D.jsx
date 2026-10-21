// Three.js hero: three glowing rings orbiting each other over a field of particles, tilting
// toward the pointer/device. Loaded on demand; renders one still frame under Reduce Motion
// and stops when it scrolls out of view.
import { useEffect, useRef } from 'react'
import { reducedMotion } from './motion.js'

export default function Hero3D({ height = 220 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    let raf = 0, dispose = () => {}, alive = true
    import('three').then(THREE => {
      if (!alive || !el) return
      const w = el.clientWidth, h = el.clientHeight
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
      camera.position.z = 9
      const group = new THREE.Group()
      scene.add(group)
      const colors = [0xff4d6d, 0xb7f34a, 0x38d0ff]
      const rings = colors.map((c, i) => {
        const m = new THREE.Mesh(
          new THREE.TorusGeometry(2.4 - i * 0.62, 0.22, 32, 160),
          new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.25 })
        )
        m.rotation.x = 0.5 + i * 0.35; m.rotation.y = i * 0.6
        group.add(m); return m
      })
      const pts = new Float32Array(600 * 3)
      for (let i = 0; i < pts.length; i++) pts[i] = (Math.random() - 0.5) * 18
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      const particles = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.035, color: 0xffffff, transparent: true, opacity: 0.55 }))
      scene.add(particles)
      scene.add(new THREE.AmbientLight(0xffffff, 0.5))
      const key = new THREE.PointLight(0xffffff, 60); key.position.set(4, 5, 6); scene.add(key)
      let tx = 0, ty = 0
      const onMove = e => { tx = (e.clientX / innerWidth - 0.5) * 0.6; ty = (e.clientY / innerHeight - 0.5) * 0.6 }
      window.addEventListener('pointermove', onMove)
      let visible = true
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      io.observe(el)
      const clock = new THREE.Clock()
      const frame = () => {
        const t = clock.getElapsedTime()
        rings.forEach((m, i) => { m.rotation.x += 0.004 + i * 0.002; m.rotation.y += 0.006 - i * 0.001 })
        group.rotation.y += (tx - group.rotation.y) * 0.05
        group.rotation.x += (ty - group.rotation.x) * 0.05
        group.position.y = Math.sin(t * 1.2) * 0.12
        particles.rotation.y = t * 0.02
        renderer.render(scene, camera)
      }
      const loop = () => { if (visible) frame(); raf = requestAnimationFrame(loop) }
      if (reducedMotion()) frame(); else loop()
      dispose = () => {
        cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('pointermove', onMove)
        scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose() })
        renderer.dispose(); renderer.domElement.remove()
      }
    })
    return () => { alive = false; dispose() }
  }, [])
  return <div ref={ref} aria-hidden style={{ height, width: '100%', position: 'relative' }} />
}
