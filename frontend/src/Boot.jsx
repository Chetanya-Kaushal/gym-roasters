import { useEffect } from 'react'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'

// Client entry (was main.jsx under Vite): renders the app and registers the service worker.
export default function Boot() {
  useEffect(() => {
    // Not in the mobile build: the native shell already serves everything from disk.
    if (!MOBILE && 'serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {})
    }
  }, [])
  return <App />
}
