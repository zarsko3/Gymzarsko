import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface CountUpStatCardProps {
  title: string
  value: number
  chart?: ReactNode
}

function CountUpStatCard({ title, value, chart }: CountUpStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const animateCount = () => {
      if (prefersReduced || hasAnimated) {
        setDisplayValue(value)
        return
      }

      const duration = 1000 // 1 second
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplayValue(Math.round(eased * value))

        if (t < 1) {
          animationRef.current = requestAnimationFrame(tick)
        } else {
          setDisplayValue(value)
          setHasAnimated(true)
        }
      }

      animationRef.current = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateCount()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(card)

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, hasAnimated])

  // Reset animation when value changes significantly
  useEffect(() => {
    if (Math.abs(value - displayValue) > 1) {
      setHasAnimated(false)
      setDisplayValue(0)
    }
  }, [value])

  return (
    <div ref={cardRef} className="bg-card rounded-xl p-4 shadow-sm">
      <div className="text-[var(--text-secondary)] text-xs font-medium text-center">{title}</div>
      <div className="mt-1 flex flex-col items-center justify-center gap-2 min-h-[88px]">
        <div className="text-3xl font-extrabold text-[var(--text-primary)] leading-none text-center">
          {displayValue}
        </div>
        {chart && (
          <div className="w-full h-12 mt-1">
            {chart}
          </div>
        )}
      </div>
    </div>
  )
}

export default CountUpStatCard

