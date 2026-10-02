import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MargineTag, PraticaCard, StatoBadge, clienteDi } from '../components/shared'
import { Card, Empty, Field, Modal, PageHeader, Progress, Segmented } from '../components/ui'
import type { Pratica, StatoPratica } from '../data/types'
import { incassato, STATO_LABEL, totRicavo } from '../lib/calc'
import { dayOffset, eur0, fmtDate, uid } from '../lib/format'
import { useStore } from '../store'

type Filtro = 'attive' | StatoPratica | 'tutte'

export default function Pratiche() {
  const { db, update } = useStore()
  const nav = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('attive')
  const [q, setQ] = useState('')
  const [nuova, setNuova] = useState(false)

  const lista = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.pratiche
      .filter((p) => (filtro === 'tutte' ? true : filtro === 'attive' ? ['confermata', 'saldata', 'in_viaggio'].includes(p.stato) : p.stato === filtro))
      .filter((p) => !s || p.titolo.toLowerCase().includes(s) || p.codice.includes(s) || p.destinazione.toLowerCase().includes(s) || (clienteDi(db, p)?.nome.toLowerCase().includes(s) ?? false))
      .sort((a, b) => (filtro === 'conclusa' || filtro === 'annullata' ? b.partenza.localeCompare(a.partenza) : a.partenza.localeCompare(b.partenza)))
  }, [db, filtro, q])

  const opts: { id: Filtro; label: string }[] = [
    { id: 'attive', label: 'Attive' },
    { id: 'preventivo', label: 'Preventivi' },
    { id: 'conclusa', label: 'Concluse' },
    { id: 'annullata', label: 'Annullate' },
    { id: 'tutte', label: 'Tutte' },
  ]

  return (
    <>
      <PageHeader
        title="Pratiche"
        subtitle="Ogni viaggio venduto: passeggeri, servizi, incassi e margine in un unico posto."
        actions={<button className="btn-brand" onClick={() => setNuova(true)}><Plus size={16} /> Nuova pratica</button>}
      />
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

      <NuovaPratica
        open={nuova}
        onClose={() => setNuova(false)}
        onCreate={(p) => {
          update((d) => ({ ...d, pratiche: [p, ...d.pratiche] }))
          setNuova(false)
          nav(`/pratiche/${p.id}`)
        }}
      />
    </>
  )
}

function NuovaPratica({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (p: Pratica) => void }) {
  const { db } = useStore()
  const [clienteId, setClienteId] = useState('')
  const [titolo, setTitolo] = useState('')
  const [destinazione, setDestinazione] = useState('')
  const [partenza, setPartenza] = useState(dayOffset(60))
  const [rientro, setRientro] = useState(dayOffset(67))
  const [extraUE, setExtraUE] = useState(false)
  const [operatoreId, setOperatoreId] = useState(db.operatori[0].id)
  const valido = clienteId && titolo.trim() && destinazione.trim() && partenza && rientro >= partenza

  const crea = () => {
    const anno = new Date().getFullYear()
    const prossimo = db.pratiche.reduce((m, p) => Math.max(m, parseInt(p.codice.split('/')[1], 10) || 0), 0) + 3
    onCreate({
      id: uid('pr'),
      codice: `${anno}/${String(prossimo).padStart(4, '0')}`,
      clienteId, operatoreId, titolo: titolo.trim(), destinazione: destinazione.trim(), extraUE,
      stato: 'preventivo', partenza, rientro, creata: dayOffset(0), validitaPreventivo: dayOffset(7),
      passeggeri: [], servizi: [], pagamenti: [],
    })
    setTitolo(''); setDestinazione(''); setClienteId('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuova pratica" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!valido} onClick={crea}>Crea come preventivo</button></>}>
      <div className="space-y-3">
        <Field label="Cliente">
          <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Seleziona…</option>
            {db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Titolo del viaggio"><input className="input" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. Crociera nel Mediterraneo" /></Field>
        <Field label="Destinazione"><input className="input" value={destinazione} onChange={(e) => setDestinazione(e.target.value)} placeholder="Es. Grecia" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Partenza"><input type="date" className="input" value={partenza} onChange={(e) => setPartenza(e.target.value)} /></Field>
          <Field label="Rientro"><input type="date" className="input" value={rientro} min={partenza} onChange={(e) => setRientro(e.target.value)} /></Field>
        </div>
        <Field label="Operatore">
          <select className="input" value={operatoreId} onChange={(e) => setOperatoreId(e.target.value)}>
            {db.operatori.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={extraUE} onChange={(e) => setExtraUE(e.target.checked)} /> Destinazione extra UE (controlli passaporto)</label>
        <p className="text-xs text-ink-mute">La pratica nasce come <strong>{STATO_LABEL.preventivo.toLowerCase()}</strong>, valido 7 giorni. Poi aggiungi passeggeri e servizi.</p>
      </div>
    </Modal>
  )
}
