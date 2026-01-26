/**
 * Haptic feedback utility for touch interactions
 * Provides tactile confirmation for key gym workout actions
 */

type HapticIntensity = 'light' | 'medium' | 'heavy'

const VIBRATION_DURATIONS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
}

/**
 * Triggers haptic feedback if supported by the device
 * @param intensity - The intensity of the vibration ('light' | 'medium' | 'heavy')
 */
export function haptic(intensity: HapticIntensity = 'medium'): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(VIBRATION_DURATIONS[intensity])
  }
}

/**
 * Triggers a success pattern haptic feedback (two short vibrations)
 */
export function hapticSuccess(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate([15, 50, 15])
  }
}

/**
 * Triggers an error pattern haptic feedback (one longer vibration)
 */
export function hapticError(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(100)
  }
}
