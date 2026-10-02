import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Cliente, DB, Pratica } from '../data/types'
import { incassato, margine, STATO_LABEL, STATO_TONE, totRicavo } from '../lib/calc'
import { cx, daysFromToday, eur0, fmtDate, fmtDateShort, relDays } from '../lib/format'
import { Badge, Progress } from './ui'

export const clienteDi = (db: DB, p: Pratica) => db.clienti.find((c) => c.id === p.clienteId)

export function StatoBadge({ stato }: { stato: Pratica['stato'] }) {
  return <Badge tone={STATO_TONE[stato]}>{STATO_LABEL[stato]}</Badge>
}

/** Pulsanti di contatto rapido, pensati per il telefono (tel:, WhatsApp, email) */
export function Contatti({ c, compact }: { c: Cliente; compact?: boolean }) {
  const wa = c.tel.replace(/[^\d]/g, '')
  const base = compact ? 'btn-ghost btn-sm' : 'btn-ghost'
  return (
    <div className="flex flex-wrap gap-2">
      <a className={base} href={`tel:${c.tel.replace(/\s/g, '')}`}><Phone size={14} /> Chiama</a>
      <a className={base} href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
      <a className={base} href={`mailto:${c.email}`}><Mail size={14} /> Email</a>
    </div>
  )
}

/** Scheda pratica: usata nelle liste su telefono e nei riepiloghi */
export function PraticaCard({ p, db }: { p: Pratica; db: DB }) {
  const cli = clienteDi(db, p)
  const tot = totRicavo(p)
  const inc = incassato(p)
  const dd = daysFromToday(p.partenza)
  return (
    <Link to={`/pratiche/${p.id}`} className="card block p-4 transition hover:border-line-strong active:bg-canvas">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{p.titolo}</p>
          <p className="mt-0.5 truncate text-xs text-ink-mute">{cli?.nome} · {p.codice}</p>
        </div>
        <StatoBadge stato={p.stato} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-ink-soft">{p.stato === 'in_viaggio' ? `Rientro ${fmtDateShort(p.rientro)}` : `Partenza ${fmtDateShort(p.partenza)}`}</span>
        {p.stato !== 'conclusa' && p.stato !== 'annullata' && p.stato !== 'in_viaggio' && dd >= 0 && (
          <span className={cx('font-medium', dd <= 14 ? 'text-rose2' : 'text-ink-mute')}>{relDays(p.partenza)}</span>
        )}
      </div>
      {p.stato !== 'preventivo' && p.stato !== 'annullata' && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-[11px] text-ink-mute">
            <span>Incassato {eur0(inc)}</span>
            <span>{eur0(tot)}</span>
          </div>
          <Progress value={tot ? (inc / tot) * 100 : 0} tone={inc >= tot ? 'green' : 'brand'} />
        </div>
      )}
      {p.stato === 'preventivo' && (
        <p className="mt-2 text-xs text-ink-soft">
          Totale {eur0(tot)}
          {p.validitaPreventivo && <> · valido fino al {fmtDate(p.validitaPreventivo)}</>}
        </p>
      )}
    </Link>
  )
}

export function MargineTag({ p }: { p: Pratica }) {
  const m = margine(p)
  return <span className={cx('tabular-nums font-medium', m < 0 ? 'text-rose2' : 'text-ink')}>{eur0(m)}</span>
}
