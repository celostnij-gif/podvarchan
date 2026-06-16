'use client'

import { useDeviceCapabilitiesContext } from '@/providers/DeviceProvider'
import type { DeviceCapabilities } from '@/providers/DeviceProvider'

/**
 * Returns device capabilities for performance optimisations.
 *
 * Consumes shared context (single matchMedia listener at the provider level)
 * instead of creating its own listener per component.
 *
 * Falls back to safe defaults if called outside a DeviceProvider.
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  return useDeviceCapabilitiesContext()
}

export type { DeviceCapabilities }

export default useDeviceCapabilities
