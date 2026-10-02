import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Contatti, PraticaCard } from '../components/shared'
import { Card, CardTitle, Empty, PageHeader, Stat } from '../components/ui'
import { margine, totRicavo } from '../lib/calc'
import { eur0 } from '../lib/format'
import { useStore } from '../store'

export default function ClienteDetail() {
  const { id } = useParams()
  const { db, update } = useStore()
  const c = db.clienti.find((x) => x.id === id)
  if (!c) return <Navigate to="/clienti" replace />
  const mie = db.pratiche.filter((p) => p.clienteId === c.id).sort((a, b) => b.partenza.localeCompare(a.partenza))
  const reali = mie.filter((p) => p.stato !== 'annullata' && p.stato !== 'preventivo')

  return (
    <>
      <Link to="/clienti" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"><ArrowLeft size={13} /> Clienti</Link>
      <PageHeader title={c.nome} subtitle={`${c.tipo === 'azienda' ? 'Azienda' : 'Privato'} · ${c.citta}`} />
      <div className="mb-5"><Contatti c={c} /></div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Viaggi venduti" value={reali.length} tone="brand" />
        <Stat label="Valore totale" value={eur0(reali.reduce((s, p) => s + totRicavo(p), 0))} tone="green" />
        <Stat label="Margine generato" value={eur0(reali.reduce((s, p) => s + margine(p), 0))} tone="blue" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold">Pratiche</h2>
          {mie.length === 0 ? <Empty>Nessuna pratica per questo cliente.</Empty> : <div className="grid gap-3 sm:grid-cols-2">{mie.map((p) => <PraticaCard key={p.id} p={p} db={db} />)}</div>}
        </section>
        <Card className="h-fit">
          <CardTitle sub="Preferenze e cose da ricordare">Note sul cliente</CardTitle>
          <textarea className="input min-h-28" value={c.note ?? ''} placeholder="Es. preferisce la mattina, allergie, compleanni…" onChange={(e) => update((d) => ({ ...d, clienti: d.clienti.map((x) => (x.id === c.id ? { ...x, note: e.target.value } : x)) }))} />
          <dl className="mt-4 space-y-1 text-xs text-ink-soft"><div>📞 {c.tel}</div><div>✉️ {c.email || '—'}</div></dl>
        </Card>
      </div>
    </>
  )
}
