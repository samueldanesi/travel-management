import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NuovaPratica } from '../components/NuovaPratica'
import { MargineTag, PraticaCard, StatoBadge, clienteDi } from '../components/shared'
import { Card, Empty, PageHeader, Progress, Segmented } from '../components/ui'
import type { Segmento, StatoPratica } from '../data/types'
import { incassato, totRicavo } from '../lib/calc'
import { segmentoPratica } from '../lib/segmenti'
import { eur0, fmtDate } from '../lib/format'
import { useStore } from '../store'

type Filtro = 'aperte' | 'preventivo' | 'chiuse' | StatoPratica | 'tutte'

const INTESTAZIONE: Record<Segmento, { titolo: string; sotto: string }> = {
  vacanze: { titolo: 'Pratiche vacanze', sotto: 'Famiglie, coppie e gruppi: dal preventivo all’affare chiuso, fino al rientro.' },
  business: { titolo: 'Pratiche professionisti', sotto: 'Manager, sportivi e aziende: trasferte e viaggi di lavoro, dal preventivo al rientro.' },
}

const FILTRI: Record<Filtro, (s: StatoPratica) => boolean> = {
  aperte: (s) => s === 'preventivo' || s === 'confermata' || s === 'saldata' || s === 'in_viaggio',
  preventivo: (s) => s === 'preventivo',
  chiuse: (s) => s === 'confermata' || s === 'saldata' || s === 'in_viaggio',
  conclusa: (s) => s === 'conclusa',
  annullata: (s) => s === 'annullata',
  tutte: () => true,
  confermata: (s) => s === 'confermata',
  saldata: (s) => s === 'saldata',
  in_viaggio: (s) => s === 'in_viaggio',
}

export default function Pratiche({ segmento }: { segmento: Segmento }) {
  const { db, update } = useStore()
  const nav = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('aperte')
  const [q, setQ] = useState('')
  const [nuova, setNuova] = useState(false)

  const dellaSezione = useMemo(() => db.pratiche.filter((p) => segmentoPratica(db, p) === segmento), [db, segmento])
  const lista = useMemo(() => {
    const s = q.trim().toLowerCase()
    return dellaSezione
      .filter((p) => FILTRI[filtro](p.stato))
      .filter((p) => !s || p.titolo.toLowerCase().includes(s) || p.codice.includes(s) || p.destinazione.toLowerCase().includes(s) || (clienteDi(db, p)?.nome.toLowerCase().includes(s) ?? false))
      .sort((a, b) => (filtro === 'conclusa' || filtro === 'annullata' ? b.partenza.localeCompare(a.partenza) : a.partenza.localeCompare(b.partenza)))
  }, [db, dellaSezione, filtro, q])

  const conta = (f: Filtro) => dellaSezione.filter((p) => FILTRI[f](p.stato)).length
  const opts: { id: Filtro; label: string }[] = [
    { id: 'aperte', label: `Aperte (${conta('aperte')})` },
    { id: 'preventivo', label: `Preventivi (${conta('preventivo')})` },
    { id: 'chiuse', label: `Affari chiusi (${conta('chiuse')})` },
    { id: 'conclusa', label: 'Concluse' },
    { id: 'annullata', label: 'Annullate' },
    { id: 'tutte', label: 'Tutte' },
  ]
  const { titolo, sotto } = INTESTAZIONE[segmento]

  return (
    <>
      <PageHeader title={titolo} subtitle={sotto} actions={<button className="btn-brand" onClick={() => setNuova(true)}><Plus size={16} /> Nuovo preventivo</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented options={opts} value={filtro} onChange={setFiltro} />
        <div className="relative w-full sm:ml-auto sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-9" placeholder="Filtra per cliente o destinazione" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {lista.length === 0 ? <Empty>Nessuna pratica in questo elenco.</Empty> : (
        <>
          <div className="grid gap-3 md:hidden">{lista.map((p) => <PraticaCard key={p.id} p={p} db={db} />)}</div>
          <Card pad={false} className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr><th className="th">Pratica</th><th className="th">Cliente</th><th className="th">Partenza</th><th className="th">Stato</th><th className="th text-right">Totale</th><th className="th w-40">Incassato</th><th className="th text-right">Margine</th></tr>
              </thead>
              <tbody>
                {lista.map((p) => {
                  const tot = totRicavo(p)
                  const inc = incassato(p)
                  return (
                    <tr key={p.id} className="cursor-pointer hover:bg-canvas" onClick={() => nav(`/pratiche/${p.id}`)}>
                      <td className="td"><Link to={`/pratiche/${p.id}`} className="font-medium hover:text-brand">{p.titolo}</Link><div className="text-xs text-ink-mute">{p.codice}</div></td>
                      <td className="td">{clienteDi(db, p)?.nome}</td>
                      <td className="td whitespace-nowrap">{fmtDate(p.partenza)}</td>
                      <td className="td"><StatoBadge stato={p.stato} /></td>
                      <td className="td text-right tabular-nums">{eur0(tot)}</td>
                      <td className="td">{p.stato === 'preventivo' || p.stato === 'annullata' ? <span className="text-ink-mute">—</span> : <><Progress value={tot ? (inc / tot) * 100 : 0} tone={inc >= tot ? 'green' : 'brand'} /><div className="mt-1 text-[11px] text-ink-mute">{eur0(inc)}</div></>}</td>
                      <td className="td text-right"><MargineTag p={p} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {nuova && (
        <NuovaPratica
          segmento={segmento}
          onClose={() => setNuova(false)}
          onCreate={(p, nuovoCliente) => {
            update((d) => ({ ...d, clienti: nuovoCliente ? [nuovoCliente, ...d.clienti] : d.clienti, pratiche: [p, ...d.pratiche] }))
            setNuova(false)
            nav(`/pratiche/${p.id}`)
          }}
        />
      )}
    </>
  )
}
