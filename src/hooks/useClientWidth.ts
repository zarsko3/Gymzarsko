import { useLayoutEffect, useRef, useState, useEffect } from 'react'

export function useClientWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) {
      console.log('[useClientWidth] ref.current is null')
      return
    }

    console.log('[useClientWidth] Setting up ResizeObserver')

    const checkWidth = () => {
      if (ref.current) {
        const w = ref.current.getBoundingClientRect().width
        console.log('[useClientWidth] checkWidth result:', w)
        if (w > 0) {
          setWidth(prev => {
            if (prev !== w) {
              console.log('[useClientWidth] Width updated:', prev, '->', w)
              return w
            }
            return prev
          })
        }
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        console.log('[useClientWidth] ResizeObserver callback:', w)
        if (w > 0) {
          setWidth(prev => {
            if (prev !== w) {
              console.log('[useClientWidth] Width updated via ResizeObserver:', prev, '->', w)
              return w
            }
            return prev
          })
        }
      }
    })

    resizeObserver.observe(ref.current)

    // Check immediately
    checkWidth()
    
    // Also check after delays to catch cases where element isn't ready yet
    const timeout1 = setTimeout(checkWidth, 50)
    const timeout2 = setTimeout(checkWidth, 200)
    const timeout3 = setTimeout(checkWidth, 500)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
    }
  }, [])

  // Also check periodically if width is still 0 (fallback for delayed rendering)
  useEffect(() => {
    if (width === 0 && ref.current) {
      const checkWidth = () => {
        if (ref.current) {
          const w = ref.current.getBoundingClientRect().width
          console.log('[useClientWidth] Periodic check:', w)
          if (w > 0) {
            setWidth(w)
          }
        }
      }
      
      const interval = setInterval(checkWidth, 100)
      
      // Stop checking after 2 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval)
      }, 2000)
      
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [width])

  return { ref, width }
}

