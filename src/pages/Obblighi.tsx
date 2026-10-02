import { AlertTriangle, ArrowUpRight, Check, ChevronDown, CircleCheck, ExternalLink, Info, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardTitle, Field, PageHeader, Stat, Tabs } from '../components/ui'
import { problemiDocumenti } from '../lib/calc'
import { statoScadenza } from '../lib/finanza'
import { calcolaRitenuta, GUIDA, RICORRENTI, SCADENZE, type AreaScadenza } from '../lib/obblighi'
import { cx, daysFromToday, eur, eur0, fmtDate, num, relDays, uid } from '../lib/format'
import { useStore } from '../store'

type Tab = 'scadenze' | 'controlli' | 'ritenuta' | 'guida'
type Esito = 'ok' | 'attenzione' | 'problema'

const AREA_TONE: Record<AreaScadenza, 'brand' | 'blue' | 'amber'> = { Imposte: 'brand', IVA: 'blue', 'Lavoro e INPS': 'amber' }

export default function Obblighi() {
  const { db, update } = useStore()
  const [tab, setTab] = useState<Tab>('scadenze')

  const fatti = new Set(db.obblighiFatti)
  const aperte = SCADENZE.filter((s) => !fatti.has(s.id))
  const prossima = aperte[0]
  const entro30 = aperte.filter((s) => daysFromToday(s.data) <= 30).length
  const rinnoviInScadenza = db.rinnovi.filter((r) => r.scadenza && daysFromToday(r.scadenza) <= 60).length

  const controlli = useMemo(() => {
    const attive = db.pratiche.filter((p) => p.stato === 'confermata' || p.stato === 'saldata' || p.stato === 'in_viaggio')
    const carteProblema = db.carte.filter((c) => ['scaduta', 'in_scadenza'].includes(statoScadenza(c)))
    const out: { id: string; titolo: string; dettaglio: string; esito: Esito; n: number; link?: string }[] = []
    const add = (id: string, titolo: string, n: number, ok: string, ko: string, gravita: Esito, link?: string) =>
      out.push({ id, titolo, n, dettaglio: n === 0 ? ok : ko, esito: n === 0 ? 'ok' : gravita, link })

    add('doc', 'Documenti dei viaggiatori', attive.filter((p) => problemiDocumenti(p).length > 0).length, 'Tutti i passaporti e le carte d’identità sono validi per i viaggi in corso.', 'Ci sono pratiche con documenti non validi o con validità insufficiente: informare i clienti prima della partenza.', 'problema')
    add('senzapax', 'Pratiche senza passeggeri', attive.filter((p) => p.passeggeri.length === 0).length, 'Ogni pratica confermata ha i nomi dei viaggiatori.', 'Ci sono pratiche confermate senza elenco dei passeggeri: servono per biglietti, contratto e assicurazione.', 'problema')
    add('piano', 'Piano di incassi completo', attive.filter((p) => Math.abs(p.servizi.reduce((s, x) => s + x.ricavo, 0) - p.pagamenti.reduce((s, x) => s + x.importo, 0)) > 0.5).length, 'Il piano di incassi copre il totale di ogni pratica.', 'In alcune pratiche acconti e saldo non coprono il totale venduto.', 'attenzione', '/pratiche')
    add('margine', 'Margine negativo', db.pratiche.filter((p) => p.stato !== 'annullata' && p.servizi.some((s) => s.ricavo < s.costo)).length, 'Nessun servizio venduto sotto costo.', 'Ci sono servizi venduti sotto costo: ricontrollare i prezzi (anche per l’IVA 74-ter).', 'attenzione')
    add('incassi', 'Incassi scaduti da oltre 30 giorni', db.pratiche.filter((p) => p.stato !== 'annullata').flatMap((p) => p.pagamenti).filter((x) => !x.incassatoIl && daysFromToday(x.scadenza) < -30).length, 'Nessun incasso scaduto da oltre un mese.', 'Ci sono incassi scaduti da oltre 30 giorni: sollecitare o valutare il recupero.', 'problema', '/scadenzario')
    add('fornitori', 'Fornitori da pagare in ritardo', db.pratiche.filter((p) => p.stato !== 'annullata' && p.stato !== 'conclusa').flatMap((p) => p.servizi).filter((s) => !s.pagatoFornitore && s.scadenzaFornitore && daysFromToday(s.scadenzaFornitore) < 0).length, 'Nessun pagamento a fornitori in ritardo.', 'Ci sono pagamenti ai fornitori oltre la scadenza.', 'problema', '/scadenzario')
    add('preventivi', 'Preventivi scaduti ancora aperti', db.pratiche.filter((p) => p.stato === 'preventivo' && p.validitaPreventivo && daysFromToday(p.validitaPreventivo) < 0).length, 'Nessun preventivo scaduto in sospeso.', 'Ci sono preventivi oltre la validità: chiuderli o rinnovarli, perché i prezzi dei fornitori cambiano.', 'attenzione', '/pratiche')
    add('carte', 'Carte di pagamento', carteProblema.length, 'Nessuna carta scaduta o in scadenza.', 'Ci sono carte scadute o in scadenza nei prossimi 60 giorni: chiedere l’aggiornamento ai clienti.', 'attenzione')
    add('rinnovi', 'Polizze e rinnovi dell’agenzia', db.rinnovi.filter((r) => r.scadenza && daysFromToday(r.scadenza) <= 60).length, 'Nessun rinnovo entro 60 giorni.', 'Ci sono rinnovi entro 60 giorni o già scaduti: vedi l’elenco nelle scadenze.', 'problema')
    const senzaConsenso = db.clienti.filter((c) => c.segmento === 'vacanze' && (!c.marketing || !c.email)).length
    out.push({ id: 'consenso', titolo: 'Consenso email marketing', n: 0, esito: 'ok', dettaglio: `${senzaConsenso} clienti vacanze senza consenso o senza email: esclusi automaticamente dalle campagne.`, link: '/marketing' })
    return out
  }, [db])
  const daSistemare = controlli.filter((c) => c.esito !== 'ok').length

  const segna = (id: string) => update((d) => ({ ...d, obblighiFatti: d.obblighiFatti.includes(id) ? d.obblighiFatti.filter((x) => x !== id) : [...d.obblighiFatti, id] }))

  return (
    <>
      <PageHeader
        title="Obblighi fiscali e normative"
        subtitle="Castruccio Viaggi s.a.s.: scadenze, regole del settore e controlli sui dati del gestionale."
      />
      <div className="mb-5 flex items-start gap-2 rounded-lg bg-sky2-soft px-3 py-2.5 text-xs text-sky2">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>Guida orientativa aggiornata a ottobre 2026, con fonti indicate. Non sostituisce il commercialista né il consulente del lavoro: le norme cambiano ogni anno e alcune dipendono dalla situazione dell’agenzia, quindi le date vanno confermate con loro.</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Prossima scadenza" value={prossima ? fmtDate(prossima.data) : '—'} hint={prossima ? `${relDays(prossima.data)} · ${prossima.titolo.slice(0, 32)}…` : 'Tutto fatto'} tone={prossima && daysFromToday(prossima.data) <= 14 ? 'red' : 'brand'} />
        <Stat label="Scadenze entro 30 giorni" value={entro30} hint={`${aperte.length} ancora da fare`} tone="blue" />
        <Stat label="Controlli da sistemare" value={daSistemare} hint="sui dati del gestionale" tone={daSistemare ? 'amber' : 'green'} />
        <Stat label="Rinnovi entro 60 giorni" value={rinnoviInScadenza} hint="polizze, firma digitale, corsi" tone={rinnoviInScadenza ? 'red' : 'green'} />
      </div>

      <Tabs<Tab>
        tabs={[
          { id: 'scadenze', label: 'Scadenze' },
          { id: 'controlli', label: 'Controlli', badge: daSistemare ? <Badge tone="amber">{daSistemare}</Badge> : undefined },
          { id: 'ritenuta', label: 'Ritenuta provvigioni', badge: <Badge tone="brand">Novità 2026</Badge> },
          { id: 'guida', label: 'Guida' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="pt-5">
        {tab === 'scadenze' && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <section>
                <h2 className="mb-3 text-[15px] font-semibold">Scadenze fiscali dei prossimi mesi</h2>
                <ul className="card divide-y divide-line overflow-hidden">
                  {SCADENZE.map((s) => {
                    const fatto = fatti.has(s.id)
                    const gg = daysFromToday(s.data)
                    return (
                      <li key={s.id} className={cx('flex items-start gap-3 px-4 py-3', fatto && 'bg-canvas/60')}>
                        <button
                          role="checkbox"
                          aria-checked={fatto}
                          aria-label={`Segna come fatto: ${s.titolo}`}
                          onClick={() => segna(s.id)}
                          className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition', fatto ? 'border-moss bg-moss text-white' : 'border-line-strong bg-white hover:border-brand')}
                        >
                          {fatto && <Check size={13} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cx('text-sm font-medium', fatto && 'text-ink-mute line-through')}>{s.titolo}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">{s.descrizione}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                            <Badge tone={AREA_TONE[s.area]}>{s.area}</Badge>
                            {s.fonte && <a href={s.fonte.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky2 hover:underline">{s.fonte.label} <ExternalLink size={10} /></a>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">{fmtDate(s.data)}</p>
                          {!fatto && <p className={cx('text-[11px]', gg <= 14 ? 'font-medium text-rose2' : 'text-ink-mute')}>{relDays(s.data)}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
              <section>
                <h2 className="mb-3 text-[15px] font-semibold">Adempimenti che tornano sempre</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {RICORRENTI.map((r) => (
                    <Card key={r.titolo}><p className="text-sm font-semibold">{r.titolo}</p><p className="mt-1 text-xs text-ink-soft">{r.testo}</p></Card>
                  ))}
                </div>
              </section>
            </div>
            <Rinnovi />
          </div>
        )}

        {tab === 'controlli' && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Controlli automatici sui dati inseriti. Servono a scoprire prima i problemi che portano sanzioni, rimborsi o clienti arrabbiati.</p>
            {controlli.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start gap-3">
                  <span className={cx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white', c.esito === 'ok' ? 'bg-moss' : c.esito === 'attenzione' ? 'bg-amber2' : 'bg-rose2')}>
                    {c.esito === 'ok' ? <CircleCheck size={15} /> : <AlertTriangle size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.titolo} {c.n > 0 && <Badge tone={c.esito === 'problema' ? 'red' : 'amber'} className="ml-1">{c.n}</Badge>}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{c.dettaglio}</p>
                  </div>
                  {c.link && <Link to={c.link} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">Apri <ArrowUpRight size={12} /></Link>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'ritenuta' && <Ritenuta />}

        {tab === 'guida' && (
          <div className="space-y-3">
            {GUIDA.map((s, i) => (
              <details key={s.id} className="card group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-[15px] font-semibold">{s.titolo}</p>
                    <p className="text-xs text-ink-mute">{s.intro}</p>
                  </div>
                  <ChevronDown size={18} className="shrink-0 text-ink-mute transition group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-line p-4">
                  {s.voci.map((v) => (
                    <div key={v.titolo}>
                      <p className="text-sm font-semibold">{v.titolo}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{v.testo}</p>
                      {v.fonte && <a href={v.fonte.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-sky2 hover:underline">{v.fonte.label} <ExternalLink size={10} /></a>}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function Rinnovi() {
  const { db, update } = useStore()
  const [titolo, setTitolo] = useState('')
  const [data, setData] = useState('')
  const set = (id: string, patch: Partial<(typeof db.rinnovi)[number]>) => update((d) => ({ ...d, rinnovi: d.rinnovi.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const ordinati = [...db.rinnovi].sort((a, b) => (a.scadenza ?? '9999').localeCompare(b.scadenza ?? '9999'))

  return (
    <section className="lg:col-span-2">
      <h2 className="mb-3 text-[15px] font-semibold">Rinnovi dell’agenzia</h2>
      <Card pad={false}>
        <ul className="divide-y divide-line">
          {ordinati.map((r) => {
            const gg = r.scadenza ? daysFromToday(r.scadenza) : null
            return (
              <li key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{r.titolo}</p>
                  <button className="rounded p-1 text-ink-mute hover:bg-rose2-soft hover:text-rose2" aria-label="Elimina" onClick={() => update((d) => ({ ...d, rinnovi: d.rinnovi.filter((x) => x.id !== r.id) }))}><Trash2 size={14} /></button>
                </div>
                {r.note && <p className="mt-0.5 text-xs text-ink-mute">{r.note}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="date" aria-label={`Scadenza: ${r.titolo}`} className="input w-auto py-1 text-xs" value={r.scadenza ?? ''} onChange={(e) => set(r.id, { scadenza: e.target.value || undefined })} />
                  {gg !== null && <Badge tone={gg < 0 ? 'red' : gg <= 60 ? 'amber' : 'green'}>{gg < 0 ? `scaduto ${relDays(r.scadenza!)}` : gg <= 60 ? `scade ${relDays(r.scadenza!)}` : 'in regola'}</Badge>}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex gap-2 border-t border-line p-3">
          <input className="input flex-1 py-1.5 text-sm" placeholder="Nuovo rinnovo (es. Polizza cyber)" value={titolo} onChange={(e) => setTitolo(e.target.value)} />
          <input type="date" aria-label="Data del nuovo rinnovo" className="input w-auto py-1.5 text-sm" value={data} onChange={(e) => setData(e.target.value)} />
          <button className="btn-brand btn-sm" disabled={!titolo.trim()} onClick={() => { update((d) => ({ ...d, rinnovi: [...d.rinnovi, { id: uid('rn'), titolo: titolo.trim(), scadenza: data || undefined }] })); setTitolo(''); setData('') }}><Plus size={14} /></button>
        </div>
      </Card>
      <p className="mt-2 text-[11px] text-ink-mute">Le date sono quelle fittizie della demo: inserisci le vere scadenze di polizze e garanzie.</p>
    </section>
  )
}

function Ritenuta() {
  const [provv, setProvv] = useState('1000')
  const [personale, setPersonale] = useState(true)
  const [italiano, setItaliano] = useState(true)
  const r = calcolaRitenuta(Number(provv) || 0, personale, italiano)

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <CardTitle sub="Legge di Bilancio 2026 · in vigore dal 1° maggio 2026 (rinviata dal 1° marzo)">Ritenuta sulle provvigioni delle agenzie di viaggio</CardTitle>
          <div className="space-y-3 text-sm text-ink-soft">
            <p>Chi paga all’agenzia una provvigione per l’intermediazione turistica deve trattenere una <strong className="text-ink">ritenuta d’acconto del 23%</strong>, applicata su una base ridotta. La norma estende al settore l’art. 25-bis del DPR 600/1973.</p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex gap-2"><span className="text-brand">●</span><span><strong className="text-ink">Agenzia con dipendenti o collaboratori continuativi</strong>: la ritenuta si calcola sul 20% della provvigione, quindi pesa il 4,6%.</span></li>
              <li className="flex gap-2"><span className="text-brand">●</span><span><strong className="text-ink">Agenzia senza personale</strong>: base del 50%, quindi pesa l’11,5%.</span></li>
              <li className="flex gap-2"><span className="text-brand">●</span><span>Si applica alle provvigioni pagate da <strong className="text-ink">fornitori italiani</strong> (alberghi, crociere, noleggio auto, pacchetti). Restano fuori i fornitori esteri, e secondo le fonti consultate anche la biglietteria dei trasporti.</span></li>
              <li className="flex gap-2"><span className="text-brand">●</span><span>Non è un costo: è un <strong className="text-ink">acconto d’imposta</strong> che si recupera in dichiarazione. L’effetto è sulla liquidità, perché si incassa meno subito.</span></li>
            </ul>
            <div className="rounded-lg bg-amber2-soft px-3 py-2.5 text-xs text-amber2">
              <strong>Da fare:</strong> comunicare per iscritto ai fornitori italiani che l’agenzia ha personale, così applicano la base del 20% invece del 50%. Chiedere al commercialista come registrare la ritenuta (credito verso l’Erario) e come trattare service fee e diritti d’agenzia, su cui le interpretazioni non sono uniformi.
            </div>
            <p className="text-xs text-ink-mute">Fonti:{' '}
              <a className="text-sky2 hover:underline" href="https://www.siapcn.it/2026/03/10/ritenute-acconto-2026-agenzie-viaggio/" target="_blank" rel="noreferrer">SIAP Cuneo</a>,{' '}
              <a className="text-sky2 hover:underline" href="https://www.fiscoetasse.com/new-rassegna-stampa/3601-ritenuta-provvigioni-agenzie-di-viaggio-rinvio-al-1-maggio.html" target="_blank" rel="noreferrer">FiscoeTasse</a>. Le esclusioni sono state oggetto di interventi successivi: verificare lo stato attuale.
            </p>
          </div>
        </Card>
      </div>
      <Card className="h-fit lg:col-span-2">
        <CardTitle sub="Quanto incasserai davvero">Simulatore</CardTitle>
        <div className="space-y-3">
          <Field label="Provvigione (€)"><input type="number" inputMode="decimal" className="input" value={provv} onChange={(e) => setProvv(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={personale} onChange={(e) => setPersonale(e.target.checked)} /> L’agenzia ha dipendenti o collaboratori continuativi</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={italiano} onChange={(e) => setItaliano(e.target.checked)} /> Il fornitore è italiano</label>
          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Base su cui si calcola</dt><dd className="tabular-nums">{eur(r.base)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Ritenuta (23%)</dt><dd className="tabular-nums text-rose2">− {eur(r.ritenuta)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Incasso netto</dt><dd className="tabular-nums">{eur(r.netto)}</dd></div>
            <div className="flex justify-between text-xs text-ink-mute"><dt>Peso sulla provvigione</dt><dd>{num(r.incidenza, 1)}%</dd></div>
          </dl>
          <p className="text-xs text-ink-mute">Con 100.000 € di provvigioni all’anno da fornitori italiani, e personale in agenzia, la liquidità trattenuta è di {eur0(calcolaRitenuta(100000, true, true).ritenuta)}.</p>
        </div>
      </Card>
    </div>
  )
}
