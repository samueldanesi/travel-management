import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Empty, PageHeader, Segmented } from '../components/ui'
import { SCAD_LABEL, scadenze, type TipoScadenza } from '../lib/calc'
import { cx, daysFromToday, eur0, fmtDate, relDays } from '../lib/format'
import { useStore } from '../store'

const TONE: Record<TipoScadenza, 'green' | 'amber' | 'blue' | 'red' | 'brand'> = { incasso: 'green', fornitore: 'amber', emissione: 'red', documenti: 'red', partenza: 'blue' }

export default function Scadenzario() {
  const { db } = useStore()
  const [filtro, setFiltro] = useState<TipoScadenza | 'tutte'>('tutte')
  const tutte = useMemo(() => scadenze(db), [db])
  const lista = tutte.filter((s) => filtro === 'tutte' || s.tipo === filtro)

  const gruppi = [
    { id: 'scad', label: 'In ritardo', tone: 'text-rose2', items: lista.filter((s) => daysFromToday(s.data) < 0) },
    { id: 'oggi', label: 'Oggi', tone: 'text-amber2', items: lista.filter((s) => daysFromToday(s.data) === 0) },
    { id: 'sett', label: 'Prossimi 7 giorni', tone: 'text-sky2', items: lista.filter((s) => daysFromToday(s.data) > 0 && daysFromToday(s.data) <= 7) },
    { id: 'mese', label: 'Prossimi 30 giorni', tone: 'text-ink-soft', items: lista.filter((s) => daysFromToday(s.data) > 7 && daysFromToday(s.data) <= 30) },
    { id: 'dopo', label: 'Più avanti', tone: 'text-ink-mute', items: lista.filter((s) => daysFromToday(s.data) > 30) },
  ].filter((g) => g.items.length)

  const opts: { id: TipoScadenza | 'tutte'; label: string }[] = [
    { id: 'tutte', label: 'Tutte' }, { id: 'incasso', label: 'Incassi' }, { id: 'fornitore', label: 'Fornitori' },
    { id: 'emissione', label: 'Emissioni' }, { id: 'documenti', label: 'Documenti' }, { id: 'partenza', label: 'Partenze' },
  ]

  return (
    <>
      <PageHeader title="Scadenze" subtitle="Incassi da chiedere, fornitori da pagare, biglietti da emettere, documenti da controllare." />
      <div className="mb-5"><Segmented options={opts} value={filtro} onChange={setFiltro} /></div>
      {gruppi.length === 0 && <Empty>Nessuna scadenza in questa categoria.</Empty>}
      <div className="space-y-6">
        {gruppi.map((g) => (
          <section key={g.id}>
            <h2 className={cx('mb-2 text-xs font-semibold uppercase tracking-wider', g.tone)}>{g.label} · {g.items.length}</h2>
            <ul className="card divide-y divide-line overflow-hidden">
              {g.items.map((s) => (
                <li key={s.id}>
                  <Link to={`/pratiche/${s.praticaId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas active:bg-canvas">
                    <Badge tone={TONE[s.tipo]} className="hidden shrink-0 sm:inline-flex">{SCAD_LABEL[s.tipo]}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.titolo}</p>
                      <p className="truncate text-xs text-ink-mute"><span className="sm:hidden">{SCAD_LABEL[s.tipo]} · </span>{s.dettaglio}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {s.importo !== undefined && <p className="text-sm font-semibold tabular-nums">{eur0(s.importo)}</p>}
                      <p className="text-xs text-ink-mute">{fmtDate(s.data)}</p>
                      <p className={cx('text-[11px]', daysFromToday(s.data) < 0 ? 'font-medium text-rose2' : 'text-ink-mute')}>{relDays(s.data)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
