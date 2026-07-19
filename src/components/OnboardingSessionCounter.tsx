import { useEffect, useRef } from 'react'
import { track, EVENTS } from '../lib/analytics'

const STORAGE_KEY = 'daftari_session_count'

export default function OnboardingSessionCounter(): null {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      const count = raw ? Number(raw) + 1 : 1
      sessionStorage.setItem(STORAGE_KEY, String(count))

      if (count === 3) {
        track(EVENTS.ONBOARDING_ABANDONED, { sessions: count })
      }
    } catch {
      track(EVENTS.ONBOARDING_ABANDONED, { sessions: 0 })
    }
  }, [])

  return null
}
