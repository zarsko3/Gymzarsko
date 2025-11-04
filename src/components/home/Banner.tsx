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
    <div className="px-4">
      <div className="mx-auto my-4 rounded-2xl bg-accent-card p-0 sm:p-0 flex justify-center items-center overflow-hidden">
        {/* Use <img> to preserve SVG internal text layout */}
        <img
          src={src}
          alt={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Motivational banner'}
          className="mx-auto block w-[88%] sm:w-[86%] md:w-[80%] h-auto"
          style={{
            objectFit: 'contain',
            width: 'clamp(240px, 95vw, 576px)',
          }}
          role="img"
          aria-label={mode === 'logo-only' ? 'Gymzarsko Logo' : 'Gymzarsko Banner'}
        />
      </div>
    </div>
  )
}

