import { useLayoutEffect, useRef, useState } from 'react'

export function useClientWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) {
          setWidth(w)
        }
      }
    })

    resizeObserver.observe(ref.current)

    // Check immediately
    const checkWidth = () => {
      if (ref.current) {
        const w = ref.current.getBoundingClientRect().width
        if (w > 0) {
          setWidth(w)
        }
      }
    }

    checkWidth()
    
    // Also check after a short delay
    const timeoutId = setTimeout(checkWidth, 50)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  return { ref, width }
}

