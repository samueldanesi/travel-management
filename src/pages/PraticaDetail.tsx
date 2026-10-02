import { AlertTriangle, ArrowLeft, Check, Plus, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Contatti, clienteDi } from '../components/shared'
import { Avatar, Badge, Card, CardTitle, Empty, Field, Modal, PageHeader, Progress, Stat, Tabs } from '../components/ui'
import type { Passeggero, Pagamento, Pratica, Servizio, StatoServizio, TipoServizio } from '../data/types'
import { daIncassare, incassato, ivaPratica, ivaServizio, margine, marginePerc, problemiDocumenti, scopertoPiano, STATO_LABEL, STATO_ORDER, TIPO_LABEL, totCosto, totRicavo } from '../lib/calc'
import { cx, dayOffset, daysFromToday, eur, eur0, fmtDate, num, relDays, uid } from '../lib/format'
import { useStore } from '../store'

type Tab = 'servizi' | 'passeggeri' | 'incassi' | 'note'

export default function PraticaDetail() {
  const { id } = useParams()
  const { db, updatePratica } = useStore()
  const p = db.pratiche.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>('servizi')
  if (!p) return <Navigate to="/pratiche" replace />
  const cli = clienteDi(db, p)
  const op = db.operatori.find((o) => o.id === p.operatoreId)
  const upd = (fn: (p: Pratica) => Pratica) => updatePratica(p.id, fn)
  const docs = problemiDocumenti(p)
  const scaduti = p.pagamenti.filter((x) => !x.incassatoIl && daysFromToday(x.scadenza) < 0)
  const scoperto = scopertoPiano(p)
  const tot = totRicavo(p)

  return (
    <>
      <Link to="/pratiche" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"><ArrowLeft size={13} /> Pratiche</Link>
      <PageHeader
        title={p.titolo}
        subtitle={<>{p.codice} · {p.destinazione} · {fmtDate(p.partenza)} → {fmtDate(p.rientro)} · {p.passeggeri.length} pax</>}
        actions={<button className="btn-ghost hidden sm:inline-flex" onClick={() => window.print()}><Printer size={15} /> Stampa</button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={p.stato} onChange={(e) => upd((x) => ({ ...x, stato: e.target.value as Pratica['stato'] }))} aria-label="Stato pratica">
          {STATO_ORDER.map((s) => <option key={s} value={s}>{STATO_LABEL[s]}</option>)}
        </select>
        {cli && <Link to={`/clienti/${cli.id}`} className="text-sm font-medium hover:text-brand">{cli.nome}</Link>}
        {op && <span className="flex items-center gap-1.5 text-xs text-ink-mute"><Avatar name={op.nome} color={op.colore} size={22} /> {op.nome}</span>}
      </div>
      {cli && <div className="mb-5"><Contatti c={cli} compact /></div>}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Totale cliente" value={eur0(tot)} tone="neutral" />
        <Stat label="Incassato" value={eur0(incassato(p))} hint={tot ? `${num((incassato(p) / tot) * 100)}% del totale` : undefined} tone="green" />
        <Stat label="Ancora da incassare" value={eur0(daIncassare(p))} tone={scaduti.length ? 'red' : 'brand'} hint={scaduti.length ? `${scaduti.length} rata/e scaduta/e` : undefined} />
        <Stat label="Margine" value={eur0(margine(p))} hint={`${num(marginePerc(p), 1)}% sul venduto`} tone={margine(p) < 0 ? 'red' : 'green'} />
      </div>

      {(docs.length > 0 || scoperto !== 0 || scaduti.length > 0) && p.stato !== 'annullata' && (
        <div className="mb-5 space-y-2">
          {docs.map((d, i) => (
            <div key={i} className={cx('flex items-start gap-2 rounded-lg px-3 py-2 text-sm', d.grave ? 'bg-rose2-soft text-rose2' : 'bg-amber2-soft text-amber2')}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span><strong>{d.chi}</strong>: {d.testo}</span>
            </div>
          ))}
          {scaduti.map((x) => <div key={x.id} className="flex items-start gap-2 rounded-lg bg-rose2-soft px-3 py-2 text-sm text-rose2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span><strong>{x.etichetta}</strong> di {eur(x.importo)} scaduto {relDays(x.scadenza)}</span></div>)}
          {scoperto !== 0 && p.stato !== 'preventivo' && <div className="flex items-start gap-2 rounded-lg bg-amber2-soft px-3 py-2 text-sm text-amber2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>Il piano incassi {scoperto > 0 ? `non copre ${eur(scoperto)} del totale` : `supera il totale di ${eur(-scoperto)}`}.</span></div>}
        </div>
      )}

      <Tabs<Tab>
        tabs={[
          { id: 'servizi', label: 'Servizi', badge: <Badge>{p.servizi.length}</Badge> },
          { id: 'passeggeri', label: 'Passeggeri', badge: <Badge tone={docs.length ? 'red' : 'neutral'}>{p.passeggeri.length}</Badge> },
          { id: 'incassi', label: 'Incassi', badge: <Badge>{p.pagamenti.length}</Badge> },
          { id: 'note', label: 'Note' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="pt-5">
        {tab === 'servizi' && <ServiziTab p={p} upd={upd} />}
        {tab === 'passeggeri' && <PasseggeriTab p={p} upd={upd} />}
        {tab === 'incassi' && <IncassiTab p={p} upd={upd} />}
        {tab === 'note' && (
          <Card>
            <CardTitle sub="Preferenze del cliente, richieste speciali, promemoria interni">Note</CardTitle>
            <textarea className="input min-h-32" value={p.note ?? ''} onChange={(e) => upd((x) => ({ ...x, note: e.target.value }))} placeholder="Scrivi qui…" />
          </Card>
        )}
      </div>
    </>
  )
}

function ServiziTab({ p, upd }: { p: Pratica; upd: (fn: (p: Pratica) => Pratica) => void }) {
  const { db } = useStore()
  const [open, setOpen] = useState(false)
  const setServ = (sid: string, patch: Partial<Servizio>) => upd((x) => ({ ...x, servizi: x.servizi.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }))
  const forn = (id: string) => db.fornitori.find((f) => f.id === id)?.nome ?? '—'
  const statoTone: Record<StatoServizio, 'amber' | 'blue' | 'green'> = { opzione: 'amber', confermato: 'blue', emesso: 'green' }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {p.servizi.length === 0 && <Empty>Nessun servizio. Aggiungi volo, hotel, crociera o un pacchetto.</Empty>}
        {p.servizi.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{TIPO_LABEL[s.tipo]}</Badge>
                  <Badge tone={statoTone[s.stato]}>{s.stato}</Badge>
                  <Badge title={s.regime === '74ter' ? 'IVA sul margine' : 'Solo commissione'}>{s.regime === '74ter' ? '74-ter' : 'Intermediazione'}</Badge>
                </div>
                <p className="text-[15px] font-medium">{s.descrizione}</p>
                <p className="text-xs text-ink-mute">{forn(s.fornitoreId)}</p>
              </div>
              <button className="rounded-md p-1.5 text-ink-mute hover:bg-rose2-soft hover:text-rose2" aria-label="Elimina servizio" onClick={() => { if (confirm('Eliminare questo servizio?')) upd((x) => ({ ...x, servizi: x.servizi.filter((y) => y.id !== s.id) })) }}><Trash2 size={15} /></button>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
              <div><dt className="text-[11px] text-ink-mute">Cliente paga</dt><dd className="font-semibold tabular-nums">{eur0(s.ricavo)}</dd></div>
              <div><dt className="text-[11px] text-ink-mute">Costo fornitore</dt><dd className="tabular-nums">{eur0(s.costo)}</dd></div>
              <div><dt className="text-[11px] text-ink-mute">Margine</dt><dd className="font-semibold tabular-nums text-moss">{eur0(s.ricavo - s.costo)}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {s.stato !== 'emesso' && (
                <button className="btn-ghost btn-sm" onClick={() => setServ(s.id, { stato: 'emesso' })}><Check size={13} /> Segna come emesso</button>
              )}
              {s.stato === 'opzione' && <button className="btn-ghost btn-sm" onClick={() => setServ(s.id, { stato: 'confermato' })}>Conferma opzione</button>}
              {s.scadenzaEmissione && s.stato !== 'emesso' && <span className={daysFromToday(s.scadenzaEmissione) <= 3 ? 'font-medium text-rose2' : 'text-ink-mute'}>Entro il {fmtDate(s.scadenzaEmissione)} ({relDays(s.scadenzaEmissione)})</span>}
              <span className="ml-auto flex items-center gap-2">
                {s.pagatoFornitore ? <Badge tone="green"><Check size={11} /> fornitore pagato</Badge> : (
                  <>
                    {s.scadenzaFornitore && <span className={daysFromToday(s.scadenzaFornitore) <= 7 ? 'font-medium text-amber2' : 'text-ink-mute'}>Pagare fornitore {relDays(s.scadenzaFornitore)}</span>}
                    <button className="btn-ghost btn-sm" onClick={() => setServ(s.id, { pagatoFornitore: true })}>Fornitore pagato</button>
                  </>
                )}
              </span>
            </div>
          </Card>
        ))}
        <button className="btn-ghost w-full" onClick={() => setOpen(true)}><Plus size={15} /> Aggiungi servizio</button>
      </div>

      <Card className="h-fit">
        <CardTitle sub="Stima indicativa, da verificare con il commercialista">Margine e IVA</CardTitle>
        <dl className="space-y-2 text-sm">
          <Row k="Incasso dal cliente" v={eur(totRicavo(p))} />
          <Row k="Costi fornitori" v={`− ${eur(totCosto(p))}`} />
          <div className="border-t border-line pt-2"><Row k="Margine lordo" v={eur(margine(p))} strong /></div>
          <Row k="IVA stimata sul margine" v={`− ${eur(ivaPratica(p))}`} />
          <div className="border-t border-line pt-2"><Row k="Margine netto IVA" v={eur(margine(p) - ivaPratica(p))} strong /></div>
        </dl>
        <p className="mt-3 text-[11px] leading-snug text-ink-mute">
          Nei pacchetti (regime 74-ter) l’IVA si calcola sul margine, non sul prezzo di vendita. Per gli altri servizi l’agenzia incassa solo la commissione.
        </p>
        {p.servizi.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-[11px] text-ink-mute">
            {p.servizi.map((s) => <li key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.descrizione}</span><span className="tabular-nums">IVA {eur(ivaServizio(s))}</span></li>)}
          </ul>
        )}
      </Card>

      <NuovoServizio open={open} onClose={() => setOpen(false)} onAdd={(s) => { upd((x) => ({ ...x, servizi: [...x.servizi, s] })); setOpen(false) }} />
    </div>
  )
}

const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <div className="flex justify-between gap-3"><dt className={strong ? 'font-medium' : 'text-ink-soft'}>{k}</dt><dd className={cx('tabular-nums', strong && 'font-semibold')}>{v}</dd></div>
)

function NuovoServizio({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (s: Servizio) => void }) {
  const { db } = useStore()
  const [tipo, setTipo] = useState<TipoServizio>('hotel')
  const [descrizione, setDescrizione] = useState('')
  const [fornitoreId, setFornitoreId] = useState(db.fornitori[0].id)
  const [costo, setCosto] = useState('')
  const [ricavo, setRicavo] = useState('')
  const [regime, setRegime] = useState<Servizio['regime']>('74ter')
  const ok = descrizione.trim() && Number(ricavo) > 0 && Number(costo) >= 0 && costo !== ''
  const aggiungi = () => {
    onAdd({ id: uid('s'), tipo, descrizione: descrizione.trim(), fornitoreId, costo: Number(costo), ricavo: Number(ricavo), regime, stato: 'opzione', pagatoFornitore: false, scadenzaEmissione: dayOffset(5) })
    setDescrizione(''); setCosto(''); setRicavo('')
  }
  return (
    <Modal open={open} onClose={onClose} title="Aggiungi servizio" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!ok} onClick={aggiungi}>Aggiungi</button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className="input" value={tipo} onChange={(e) => { const t = e.target.value as TipoServizio; setTipo(t); setRegime(['volo', 'assicurazione', 'transfer', 'visto', 'noleggio'].includes(t) ? 'intermediazione' : '74ter') }}>{(Object.keys(TIPO_LABEL) as TipoServizio[]).map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}</select></Field>
          <Field label="Fornitore"><select className="input" value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)}>{db.fornitori.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></Field>
        </div>
        <Field label="Descrizione"><input className="input" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Es. Hotel 4 stelle, 5 notti, colazione" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo fornitore (€)"><input type="number" inputMode="decimal" className="input" value={costo} onChange={(e) => setCosto(e.target.value)} /></Field>
          <Field label="Prezzo al cliente (€)"><input type="number" inputMode="decimal" className="input" value={ricavo} onChange={(e) => setRicavo(e.target.value)} /></Field>
        </div>
        <Field label="Regime IVA"><select className="input" value={regime} onChange={(e) => setRegime(e.target.value as Servizio['regime'])}><option value="74ter">Pacchetto — 74-ter (IVA sul margine)</option><option value="intermediazione">Intermediazione (solo commissione)</option></select></Field>
        <p className="text-xs text-ink-mute">Il servizio nasce come “opzione”, con promemoria a 5 giorni.</p>
      </div>
    </Modal>
  )
}

function PasseggeriTab({ p, upd }: { p: Pratica; upd: (fn: (p: Pratica) => Pratica) => void }) {
  const [open, setOpen] = useState(false)
  const docs = problemiDocumenti(p)
  return (
    <div className="space-y-3">
      {p.passeggeri.length === 0 && <Empty>Nessun passeggero. Aggiungi i nomi esattamente come sul documento.</Empty>}
      {p.passeggeri.map((x) => {
        const pr = docs.find((d) => d.chi === `${x.nome} ${x.cognome}`)
        const gg = daysFromToday(x.docScadenza)
        return (
          <Card key={x.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium">{x.nome} {x.cognome}</p>
                <p className="text-xs text-ink-mute">Nato il {fmtDate(x.nascita)} · {x.docTipo === 'passaporto' ? 'Passaporto' : 'Carta d’identità'} {x.docNumero || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {pr ? <Badge tone={pr.grave ? 'red' : 'amber'}>{pr.testo}</Badge> : <Badge tone="green"><Check size={11} /> doc. valido</Badge>}
                <button className="rounded-md p-1.5 text-ink-mute hover:bg-rose2-soft hover:text-rose2" aria-label="Rimuovi" onClick={() => upd((y) => ({ ...y, passeggeri: y.passeggeri.filter((z) => z.id !== x.id) }))}><Trash2 size={15} /></button>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-soft">Scadenza documento: {fmtDate(x.docScadenza)} ({gg > 0 ? `tra ${num(gg / 30, 0)} mesi` : 'scaduto'})</p>
          </Card>
        )
      })}
      <button className="btn-ghost w-full" onClick={() => setOpen(true)}><Plus size={15} /> Aggiungi passeggero</button>
      <NuovoPasseggero open={open} onClose={() => setOpen(false)} onAdd={(x) => { upd((y) => ({ ...y, passeggeri: [...y.passeggeri, x] })); setOpen(false) }} />
    </div>
  )
}

function NuovoPasseggero({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (x: Passeggero) => void }) {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [nascita, setNascita] = useState('')
  const [docTipo, setDocTipo] = useState<Passeggero['docTipo']>('carta_identita')
  const [docNumero, setDocNumero] = useState('')
  const [docScadenza, setDocScadenza] = useState('')
  const ok = nome.trim() && cognome.trim() && nascita && docScadenza
  return (
    <Modal open={open} onClose={onClose} title="Aggiungi passeggero" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!ok} onClick={() => { onAdd({ id: uid('x'), nome: nome.trim(), cognome: cognome.trim(), nascita, docTipo, docNumero: docNumero.trim(), docScadenza }); setNome(''); setCognome(''); setNascita(''); setDocNumero(''); setDocScadenza('') }}>Aggiungi</button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
          <Field label="Cognome"><input className="input" value={cognome} onChange={(e) => setCognome(e.target.value)} /></Field>
        </div>
        <Field label="Data di nascita"><input type="date" className="input" value={nascita} onChange={(e) => setNascita(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Documento"><select className="input" value={docTipo} onChange={(e) => setDocTipo(e.target.value as Passeggero['docTipo'])}><option value="carta_identita">Carta d’identità</option><option value="passaporto">Passaporto</option></select></Field>
          <Field label="Numero"><input className="input" value={docNumero} onChange={(e) => setDocNumero(e.target.value)} /></Field>
        </div>
        <Field label="Scadenza documento"><input type="date" className="input" value={docScadenza} onChange={(e) => setDocScadenza(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

function IncassiTab({ p, upd }: { p: Pratica; upd: (fn: (p: Pratica) => Pratica) => void }) {
  const [open, setOpen] = useState(false)
  const tot = totRicavo(p)
  const setPag = (pid: string, patch: Partial<Pagamento>) => upd((x) => ({ ...x, pagamenti: x.pagamenti.map((y) => (y.id === pid ? { ...y, ...patch } : y)) }))
  const ordinati = [...p.pagamenti].sort((a, b) => a.scadenza.localeCompare(b.scadenza))
  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-1.5 flex justify-between text-xs text-ink-soft"><span>Incassato {eur(incassato(p))}</span><span>Totale {eur(tot)}</span></div>
        <Progress value={tot ? (incassato(p) / tot) * 100 : 0} tone="green" />
      </Card>
      {ordinati.length === 0 && <Empty>Nessun piano di pagamento. Aggiungi acconto e saldo.</Empty>}
      {ordinati.map((x) => {
        const gg = daysFromToday(x.scadenza)
        return (
          <Card key={x.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium">{x.etichetta}</p>
                <p className="text-xs text-ink-mute">
                  {x.incassatoIl ? `Incassato il ${fmtDate(x.incassatoIl)}${x.metodo ? ` · ${x.metodo}` : ''}` : <span className={gg < 0 ? 'font-medium text-rose2' : ''}>Scadenza {fmtDate(x.scadenza)} ({relDays(x.scadenza)})</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-semibold tabular-nums">{eur(x.importo)}</p>
                {x.incassatoIl ? (
                  <div className="flex items-center justify-end gap-2"><Badge tone="green"><Check size={11} /> incassato</Badge><button className="text-[11px] text-ink-mute underline" onClick={() => setPag(x.id, { incassatoIl: undefined, metodo: undefined })}>annulla</button></div>
                ) : (
                  <button className="btn-brand btn-sm mt-1" onClick={() => setPag(x.id, { incassatoIl: dayOffset(0), metodo: 'bonifico' })}>Segna incassato</button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
      <button className="btn-ghost w-full" onClick={() => setOpen(true)}><Plus size={15} /> Aggiungi rata</button>
      <NuovoIncasso p={p} open={open} onClose={() => setOpen(false)} onAdd={(x) => { upd((y) => ({ ...y, pagamenti: [...y.pagamenti, x] })); setOpen(false) }} />
    </div>
  )
}

function NuovoIncasso({ p, open, onClose, onAdd }: { p: Pratica; open: boolean; onClose: () => void; onAdd: (x: Pagamento) => void }) {
  const resto = Math.max(0, Math.round(scopertoPiano(p)))
  const [etichetta, setEtichetta] = useState('Saldo')
  const [importo, setImporto] = useState('')
  const [scadenza, setScadenza] = useState(dayOffset(30))
  return (
    <Modal open={open} onClose={onClose} title="Aggiungi rata" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!(Number(importo || resto) > 0) || !etichetta.trim()} onClick={() => { onAdd({ id: uid('p'), etichetta: etichetta.trim(), importo: Number(importo || resto), scadenza }); setImporto('') }}>Aggiungi</button></>}>
      <div className="space-y-3">
        <Field label="Descrizione"><input className="input" value={etichetta} onChange={(e) => setEtichetta(e.target.value)} /></Field>
        <Field label="Importo (€)" hint={resto > 0 ? `Non ancora pianificato: ${eur0(resto)}. Lascia vuoto per usarlo tutto.` : undefined}><input type="number" inputMode="decimal" className="input" placeholder={resto ? String(resto) : ''} value={importo} onChange={(e) => setImporto(e.target.value)} /></Field>
        <Field label="Scadenza"><input type="date" className="input" value={scadenza} onChange={(e) => setScadenza(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
