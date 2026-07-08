'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

/* ── Types ── */

export interface DeviceCapabilities {
  /** True on touch devices (mobile/tablet with coarse pointer) */
  isMobile: boolean
  /** User prefers reduced motion (accessibility setting) */
  prefersReducedMotion: boolean
  /** Should reduce animations: mobile OR prefers-reduced-motion */
  shouldReduceAnimations: boolean
}

/* ── Context defaults (SSR-safe) ── */

const DeviceContext = createContext<DeviceCapabilities>({
  isMobile: false,
  prefersReducedMotion: false,
  shouldReduceAnimations: false,
})

/* ── Provider ── */

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<DeviceCapabilities>({
    isMobile: false,
    prefersReducedMotion: false,
    shouldReduceAnimations: false,
  })

  useEffect(() => {
    const pointerMq = window.matchMedia('(pointer: coarse)')
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    function update() {
      const isMobile = pointerMq.matches
      const prefersReducedMotion = motionMq.matches
      setCaps({
        isMobile,
        prefersReducedMotion,
        shouldReduceAnimations: isMobile || prefersReducedMotion,
      })
    }

    update()

    pointerMq.addEventListener('change', update)
    motionMq.addEventListener('change', update)

    return () => {
      pointerMq.removeEventListener('change', update)
      motionMq.removeEventListener('change', update)
    }
  }, [])

  return (
    <DeviceContext.Provider value={caps}>
      {children}
    </DeviceContext.Provider>
  )
}

/* ── Hook ── */

export function useDeviceCapabilitiesContext(): DeviceCapabilities {
  return useContext(DeviceContext)
}
