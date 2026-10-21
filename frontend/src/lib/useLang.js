import { useSyncExternalStore } from 'react'
import { subscribeLang, langVersion } from './i18n.js'

// Re-renders the subscribing component (and its children) whenever the language changes.
export const useLang = () => useSyncExternalStore(subscribeLang, langVersion)
