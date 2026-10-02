import { ArrowLeft, MailCheck, MailX } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Contatti, PraticaCard } from '../components/shared'
import { Badge, Card, CardTitle, Empty, PageHeader, Stat } from '../components/ui'
import { margine, totRicavo } from '../lib/calc'
import { CATEGORIA_LABEL } from '../lib/segmenti'
import { eur0 } from '../lib/format'
import { useStore } from '../store'

export default function ClienteDetail() {
  const { id } = useParams()
  const { db, update } = useStore()
  const c = db.clienti.find((x) => x.id === id)
  if (!c) return <Navigate to="/clienti" replace />
  const mie = db.pratiche.filter((p) => p.clienteId === c.id).sort((a, b) => b.partenza.localeCompare(a.partenza))
  const reali = mie.filter((p) => p.stato !== 'annullata' && p.stato !== 'preventivo')
  const biz = c.segmento === 'business'
  const set = (patch: Partial<typeof c>) => update((d) => ({ ...d, clienti: d.clienti.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) }))

  return (
    <>
      <Link to="/clienti" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"><ArrowLeft size={13} /> Clienti</Link>
      <PageHeader
        title={c.nome}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={biz ? 'blue' : 'brand'}>{biz ? 'Professionista' : 'Viaggi vacanze'}</Badge>
            {c.categoria && <Badge>{CATEGORIA_LABEL[c.categoria]}</Badge>}
            <span>{[c.ruolo, c.organizzazione, c.citta].filter(Boolean).join(' · ')}</span>
          </span>
        }
      />
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
        <div className="space-y-4">
          <Card>
            <CardTitle sub={biz ? 'Riservatezza, tariffe, preferenze' : 'Preferenze e cose da ricordare'}>Note sul cliente</CardTitle>
            <textarea className="input min-h-28" value={c.note ?? ''} placeholder="Es. preferisce la mattina, allergie, compleanni…" onChange={(e) => set({ note: e.target.value })} />
            {biz && c.referente && <p className="mt-3 text-xs text-ink-soft">Referente per le prenotazioni: <strong>{c.referente}</strong></p>}
            {!biz && c.interessi.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{c.interessi.map((i) => <Badge key={i}>{i}</Badge>)}</div>}
            <dl className="mt-4 space-y-1 text-xs text-ink-soft"><div>📞 {c.tel}</div><div>✉️ {c.email || 'nessuna email'}</div></dl>
          </Card>
          {!biz && <Card>
            <CardTitle sub="Obbligatorio per inviare newsletter e offerte">Email marketing</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <span className={`flex items-center gap-2 text-sm ${c.marketing && c.email ? 'text-moss' : 'text-ink-soft'}`}>
                {c.marketing && c.email ? <MailCheck size={16} /> : <MailX size={16} />}
                {c.marketing && c.email ? 'Consenso attivo' : c.email ? 'Nessun consenso' : 'Manca l’indirizzo email'}
              </span>
              <button className="btn-ghost btn-sm" disabled={!c.email} onClick={() => set({ marketing: !c.marketing })}>{c.marketing ? 'Revoca' : 'Registra consenso'}</button>
            </div>
          </Card>}
        </div>
      </div>
    </>
  )
}
