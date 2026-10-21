'use client'
// The whole app is client-only (it reads localStorage, document and the service worker at
// module load), so it is loaded without server rendering.
import dynamic from 'next/dynamic'

const Boot = dynamic(() => import('../src/Boot.jsx'), { ssr: false })

export default function Page() {
  return <div id="root"><Boot /></div>
}
