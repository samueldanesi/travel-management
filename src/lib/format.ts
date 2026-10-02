export const TODAY = (() => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
})()

export const iso = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Data ISO a `n` giorni da oggi (negativo = passato) */
export const dayOffset = (n: number) => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + n)
  return iso(d)
}

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export const daysFromToday = (s: string) =>
  Math.round((parse(s).getTime() - TODAY.getTime()) / 86_400_000)

const eurFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const eurFmt0 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const eur = (n: number) => eurFmt.format(n)
export const eur0 = (n: number) => eurFmt0.format(n)
export const eurK = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M€`
    : Math.abs(n) >= 1000
      ? `${Math.round(n / 1000)} k€`
      : `${Math.round(n)} €`

export const num = (n: number, d = 0) =>
  new Intl.NumberFormat('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

const dateFmt = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
const dateShort = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' })
export const fmtDate = (s?: string) => (s ? dateFmt.format(parse(s)).replace('.', '') : '—')
export const fmtDateShort = (s: string) => dateShort.format(parse(s)).replace('.', '')

export const relDays = (s: string) => {
  const n = daysFromToday(s)
  if (n === 0) return 'oggi'
  if (n === 1) return 'domani'
  if (n === -1) return 'ieri'
  if (n > 0) return `tra ${n} giorni`
  return `${-n} giorni fa`
}

export const monthLabel = (d: Date) =>
  new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(d)

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
