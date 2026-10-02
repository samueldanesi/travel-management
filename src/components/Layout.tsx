import { BarChart3, Briefcase, CalendarClock, Home, LayoutGrid, Mail, Menu, Plane, RotateCcw, Search, Store, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { scadenze } from '../lib/calc'
import { cx, daysFromToday } from '../lib/format'
import { useStore } from '../store'
import { Badge } from './ui'

const NAV = [
  { to: '/', label: 'Oggi', icon: Home, end: true },
  { to: '/pratiche', label: 'Pratiche', icon: Briefcase },
  { to: '/scadenzario', label: 'Scadenze', icon: CalendarClock, badge: true },
  { to: '/clienti', label: 'Clienti', icon: Users },
  { to: '/marketing', label: 'Email marketing', icon: Mail },
  { to: '/fornitori', label: 'Fornitori', icon: Store },
  { to: '/report', label: 'Report', icon: BarChart3 },
]
// Sul telefono: 4 voci in basso + "Altro" per il resto
const BOTTOM = NAV.slice(0, 4)

function GlobalSearch() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return [
      ...db.pratiche
        .filter((p) => p.titolo.toLowerCase().includes(s) || p.codice.includes(s) || p.destinazione.toLowerCase().includes(s))
        .map((p) => ({ k: p.id, t: p.titolo, s: `Pratica ${p.codice}`, to: `/pratiche/${p.id}` })),
      ...db.clienti.filter((c) => c.nome.toLowerCase().includes(s)).map((c) => ({ k: c.id, t: c.nome, s: 'Cliente', to: `/clienti/${c.id}` })),
    ].slice(0, 7)
  }, [q, db])
  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
      <input
        className="input pl-9"
        placeholder="Cerca pratiche, clienti, destinazioni…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="card absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden py-1 shadow-lg">
          {results.map((r) => (
            <li key={r.k}>
              <button className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-canvas" onMouseDown={() => { nav(r.to); setQ('') }}>
                <span className="truncate font-medium">{r.t}</span>
                <span className="ml-3 shrink-0 text-xs text-ink-mute">{r.s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Layout() {
  const { db, reset } = useStore()
  const [more, setMore] = useState(false)
  const loc = useLocation()
  const urgenti = useMemo(() => scadenze(db).filter((s) => daysFromToday(s.data) <= 0).length, [db])

  const brand = (
    <Link to="/" className="flex items-center gap-3" onClick={() => setMore(false)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white"><Plane size={18} /></span>
      <span>
        <span className="display block text-[17px] font-semibold leading-none">Castruccio Viaggi</span>
        <span className="mt-1 block text-[11px] uppercase tracking-wider text-ink-mute">Gestionale agenzia</span>
      </span>
    </Link>
  )

  const links = (onClick?: () => void) =>
    NAV.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        onClick={onClick}
        className={({ isActive }) =>
          cx('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium transition', isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-ink')
        }
      >
        <it.icon size={18} strokeWidth={1.8} />
        <span className="flex-1">{it.label}</span>
        {it.badge && urgenti > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">{urgenti}</span>}
      </NavLink>
    ))

  const resetBtn = (
    <button onClick={() => { if (confirm('Ripristinare i dati dimostrativi originali?')) reset() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-mute hover:bg-white hover:text-ink">
      <RotateCcw size={13} /> Ripristina dati demo
    </button>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop: barra laterale */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-canvas lg:flex">
        <div className="px-5 py-5">{brand}</div>
        <nav className="flex-1 space-y-1 px-3">{links()}</nav>
        <div className="border-t border-line p-3">{resetBtn}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="safe-top sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5 lg:px-8">
            <span className="lg:hidden">{brand}</span>
            <div className="ml-auto hidden flex-1 lg:block lg:ml-0"><GlobalSearch /></div>
            <Badge tone="brand" className="ml-auto hidden sm:inline-flex lg:ml-auto">Demo — dati fittizi</Badge>
          </div>
          <div className="px-4 pb-2.5 lg:hidden"><GlobalSearch /></div>
        </header>
        <main key={loc.pathname} className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Telefono: barra in basso, come un'app */}
      <nav className="bottom-nav safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {BOTTOM.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium', isActive ? 'text-brand' : 'text-ink-mute')}>
              <it.icon size={21} strokeWidth={1.8} />
              {it.label}
              {it.badge && urgenti > 0 && <span className="absolute right-[26%] top-1 rounded-full bg-rose2 px-1.5 text-[9px] font-bold leading-4 text-white">{urgenti}</span>}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium text-ink-mute">
            <LayoutGrid size={21} strokeWidth={1.8} />
            Altro
          </button>
        </div>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMore(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 rounded-t-2xl bg-canvas p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><Menu size={16} /> Menu</span>
              <button className="rounded-md p-1 text-ink-mute" onClick={() => setMore(false)} aria-label="Chiudi"><X size={18} /></button>
            </div>
            <div className="space-y-1">{links(() => setMore(false))}</div>
            <div className="mt-3 border-t border-line pt-2">{resetBtn}</div>
          </div>
        </div>
      )}
    </div>
  )
}
