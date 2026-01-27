import { useEffect, useState } from 'react'

type BannerMode = 'random-banners' | 'logo-only'

const BANNERS = ['/Baner1.svg', '/Baner2.svg', '/Baner3.svg']

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

    // Pick a random banner on each page load/refresh
    const valid = BANNERS.filter(Boolean)
    const pick = valid[Math.floor(Math.random() * valid.length)] ?? '/Baner1.svg'
    setSrc(pick)
  }, [mode])

  if (!src) return null

  return (
    <div className="w-full">
      <div className="w-full bg-[var(--bg-primary)] flex justify-center items-center overflow-hidden">
        {/* Use <img> to preserve SVG internal text layout */}
        <img
          src={src}
          alt={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Motivational banner'}
          className="block w-full h-auto object-contain"
          role="img"
          aria-label={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Gymzarsko Banner'}
        />
      </div>
    </div>
  )
}

