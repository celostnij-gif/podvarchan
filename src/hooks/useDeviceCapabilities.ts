'use client'

import { useState, useEffect } from 'react'

export interface DeviceCapabilities {
  /** True on touch devices (mobile/tablet with coarse pointer) */
  isMobile: boolean
  /** User prefers reduced motion (accessibility setting) */
  prefersReducedMotion: boolean
  /** Should reduce animations: mobile OR prefers-reduced-motion */
  shouldReduceAnimations: boolean
}

/**
 * Detects device capabilities for performance optimizations.
 * - `isMobile`: detects touch devices via `(pointer: coarse)`
 * - `prefersReducedMotion`: detects OS-level reduced motion setting
 * - `shouldReduceAnimations`: OR of both — use to disable heavy animations
 *
 * Defaults to `false` on SSR to avoid hydration mismatch.
 */
export function useDeviceCapabilities(): DeviceCapabilities {
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

  return caps
}

export default useDeviceCapabilities
