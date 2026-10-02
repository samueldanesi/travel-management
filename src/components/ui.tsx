import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx, initials } from '../lib/format'

export type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'brand' | 'dark'

const TONES: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-soft ring-line-strong',
  green: 'bg-moss-soft text-moss ring-moss/20',
  amber: 'bg-amber2-soft text-amber2 ring-amber2/25',
  red: 'bg-rose2-soft text-rose2 ring-rose2/25',
  blue: 'bg-sky2-soft text-sky2 ring-sky2/20',
  brand: 'bg-brand-soft text-brand-dark ring-brand/20',
  dark: 'bg-ink text-white ring-ink',
}

export function Badge({ tone = 'neutral', children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONES[tone], className)}>
      {children}
    </span>
  )
}

export function Dot({ tone }: { tone: Tone }) {
  const c: Record<Tone, string> = {
    neutral: 'bg-ink-mute', green: 'bg-moss', amber: 'bg-amber2', red: 'bg-rose2', blue: 'bg-sky2', brand: 'bg-brand', dark: 'bg-ink',
  }
  return <span className={cx('inline-block h-2 w-2 shrink-0 rounded-full', c[tone])} />
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-[28px] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={cx('card', pad && 'p-5', className)}>{children}</section>
}

export function CardTitle({ children, right, sub }: { children: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
        {sub && <p className="mt-0.5 text-xs text-ink-mute">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Stat({
  label, value, hint, tone = 'neutral', icon,
}: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  const bar: Record<Tone, string> = {
    neutral: 'bg-line-strong', green: 'bg-moss', amber: 'bg-amber2', red: 'bg-rose2', blue: 'bg-sky2', brand: 'bg-brand', dark: 'bg-ink',
  }
  return (
    <div className="card relative overflow-hidden p-4">
      <span className={cx('absolute inset-y-0 left-0 w-1', bar[tone])} />
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {icon && <span className="text-ink-mute">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-mute">{hint}</p>}
    </div>
  )
}

export function Progress({ value, tone = 'brand', className }: { value: number; tone?: Tone; className?: string }) {
  const c: Record<Tone, string> = {
    neutral: 'bg-ink-mute', green: 'bg-moss', amber: 'bg-amber2', red: 'bg-rose2', blue: 'bg-sky2', brand: 'bg-brand', dark: 'bg-ink',
  }
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}>
      <div className={cx('h-full rounded-full transition-all', c[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, color = '#8a877f', size = 28 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({ people }: { people: { id: string; nome: string; colore: string }[] }) {
  return (
    <div className="flex -space-x-2">
      {people.slice(0, 4).map((p) => <Avatar key={p.id} name={p.nome} color={p.colore} size={26} />)}
      {people.length > 4 && (
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-line text-[10px] font-semibold text-ink-soft ring-2 ring-white">
          +{people.length - 4}
        </span>
      )}
    </div>
  )
}

export function Modal({
  open, onClose, title, children, footer, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-[6vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={cx('card w-full shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-ink-mute hover:bg-canvas hover:text-ink" aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-canvas/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: { tabs: { id: T; label: string; badge?: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition',
            value === t.id ? 'border-brand text-ink' : 'border-transparent text-ink-mute hover:text-ink'
          )}
        >
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-mute">{children}</div>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-mute">{hint}</span>}
    </label>
  )
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="scrollbar-thin inline-flex max-w-full overflow-x-auto rounded-lg border border-line-strong bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx('rounded-md px-3 py-1.5 text-xs font-medium transition', value === o.id ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EntityLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="font-medium text-ink underline-offset-2 hover:text-brand hover:underline">{children}</Link>
}

export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-sky2 underline-offset-2 hover:underline">
      {children}
    </a>
  )
}

export function Check({ ok, label, warn }: { ok: boolean; label: ReactNode; warn?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={cx('mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', ok ? 'bg-moss' : warn ? 'bg-amber2' : 'bg-rose2')}>
        {ok ? '✓' : '!'}
      </span>
      <span className={ok ? 'text-ink-soft' : 'text-ink'}>{label}</span>
    </li>
  )
}
