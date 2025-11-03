/**
 * Utility functions for PWA detection and behavior
 */

/**
 * Detects if the app is running in standalone mode (installed PWA)
 * @returns true if running as a standalone app, false otherwise
 */
export function isStandalone(): boolean {
  // Modern approach using display-mode media query
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }
  }
  
  // iOS Safari legacy check
  if (typeof window !== 'undefined' && (window.navigator as any)?.standalone === true) {
    return true
  }
  
  return false
}

