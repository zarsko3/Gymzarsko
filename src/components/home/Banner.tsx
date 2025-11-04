import { useEffect, useState } from 'react'

type BannerMode = 'random-banners' | 'logo-only'

const BANNERS = ['/Baner1.svg', '/Baner2.svg']

interface BannerProps {
  mode?: BannerMode
}

export default function Banner({ mode = 'random-banners' }: BannerProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'logo-only') {
      setSrc('/Logo.png')
      return
    }

    // Choose once per day to avoid flicker; store in localStorage
    const todayKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const storageKey = `banner-choice:${todayKey}`

    let chosen = localStorage.getItem(storageKey)
    if (!chosen) {
      const valid = BANNERS.filter(Boolean)
      const pick = valid[Math.floor(Math.random() * valid.length)] ?? '/Baner1.svg'
      localStorage.setItem(storageKey, pick)
      chosen = pick
    }
    setSrc(chosen)
  }, [mode])

  if (!src) return null

  return (
    <div className="px-4">
      <div className="mx-auto my-4 rounded-2xl bg-accent-card p-0 sm:p-0 flex justify-center items-center overflow-hidden">
        {/* Use <img> to preserve SVG internal text layout */}
        <img
          src={src}
          alt={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Motivational banner'}
          className="mx-auto block w-[88%] sm:w-[86%] md:w-[80%] h-auto"
          style={{
            objectFit: 'contain',
            width: 'clamp(240px, 85vw, 576px)',
          }}
          role="img"
          aria-label={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Gymzarsko Banner'}
        />
      </div>
    </div>
  )
}

