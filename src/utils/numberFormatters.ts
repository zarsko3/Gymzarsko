const nf = new Intl.NumberFormat('en', { 
  notation: 'compact', 
  maximumFractionDigits: 1 
})

export const fmtKg = (v: number) => `${nf.format(v)} kg`

export const fmtMin = (m: number) => `${Math.round(m)}m`

export const deltaPill = (p: number) => ({
  text: `${p > 0 ? '+' : ''}${p.toFixed(1)}%`,
  class: p >= 0 ? 'text-[var(--up)]' : 'text-[var(--down)]',
  icon: p >= 0 ? '▲' : '▼'
})

