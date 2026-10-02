import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CreditCard, Euro, Plus, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CartaCard, CartaModal } from '../components/carte'
import { PraticaCard, StatoBadge, clienteDi } from '../components/shared'
import { Badge, Card, CardTitle, Empty, Field, Modal, PageHeader, Progress, Segmented, Stat } from '../components/ui'
import type { Carta, StoricoMese } from '../data/types'
import { daIncassare, pagamentiScaduti, SCAD_LABEL, scadenze } from '../lib/calc'
import { ANNO_CORRENTE, MESI, MESI_LUNGHI, mascherata, mesiChiusiCorrente, parseStorico, perAnno, scopertoCarte, serie, variazione } from '../lib/finanza'
import { cx, daysFromToday, eur0, eurK, fmtDateShort, num, relDays, TODAY } from '../lib/format'
import { useStore } from '../store'

const MESE_CORRENTE = TODAY.getMonth() + 1

function Variazione({ v, className }: { v: number | null; className?: string }) {
  if (v === null) return <span className={cx('text-ink-mute', className)}>—</span>
  const su = v >= 0
  return (
    <span className={cx('inline-flex items-center gap-0.5 font-medium tabular-nums', su ? 'text-moss' : 'text-rose2', className)}>
      {su ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {su ? '+' : '−'}{num(Math.abs(v), 1)}%
    </span>
  )
}

export default function Dashboard() {
  const { db, update } = useStore()
  const [vista, setVista] = useState<'mesi' | 'anni'>('mesi')
  const [importa, setImporta] = useState(false)
  const [cartaAperta, setCartaAperta] = useState<string | null>(null)
  const [nuovaCarta, setNuovaCarta] = useState<Carta | 'nuova' | null>(null)

  const punti = useMemo(() => serie(db), [db])
  const anni = useMemo(() => perAnno(punti), [punti])
  const corrente = anni.find((a) => a.anno === ANNO_CORRENTE)
  const precedente = anni.find((a) => a.anno === ANNO_CORRENTE - 1)
  const chiusi = mesiChiusiCorrente()
  const periodo = chiusi >= 1 ? `${MESI[0]}–${MESI[chiusi - 1]}` : ''
  const punto = (anno: number, mese: number) => punti.find((p) => p.anno === anno && p.mese === mese)

  const perMese = useMemo(
    () => MESI_LUNGHI.map((nome, i) => ({ mese: i + 1, nome, corrente: punto(ANNO_CORRENTE, i + 1)?.fatturato ?? 0, precedente: punto(ANNO_CORRENTE - 1, i + 1)?.fatturato ?? 0 })),
    [punti] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const carte = useMemo(() => scopertoCarte(db), [db])
  const vive = db.pratiche.filter((p) => p.stato === 'confermata' || p.stato === 'saldata' || p.stato === 'in_viaggio')
  const daIncassareTot = vive.reduce((s, p) => s + daIncassare(p), 0)
  const scaduti = db.pratiche.filter((p) => p.stato !== 'annullata').flatMap(pagamentiScaduti)
  const daPagare30 = db.pratiche
    .filter((p) => p.stato !== 'annullata' && p.stato !== 'conclusa')
    .flatMap((p) => p.servizi)
    .filter((s) => !s.pagatoFornitore && s.scadenzaFornitore && daysFromToday(s.scadenzaFornitore) <= 30)
    .reduce((s, x) => s + x.costo, 0)
  const prossimoAddebito = carte.righe.filter((r) => r.scoperto > 0).map((r) => r.prossimo).sort()[0]

  const urgenti = useMemo(() => scadenze(db).filter((s) => daysFromToday(s.data) <= 3).slice(0, 6), [db])
  const partenze = db.pratiche.filter((p) => (p.stato === 'confermata' || p.stato === 'saldata') && daysFromToday(p.partenza) >= 0).sort((a, b) => a.partenza.localeCompare(b.partenza)).slice(0, 4)
  const preventivi = db.pratiche.filter((p) => p.stato === 'preventivo').sort((a, b) => (a.validitaPreventivo ?? '').localeCompare(b.validitaPreventivo ?? ''))

  const ora = new Date().getHours()
  const saluto = ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const margineCorr = corrente?.margine ?? 0

  return (
    <>
      <PageHeader title={`${saluto}, Giulia`} subtitle={new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(TODAY)} />

      {/* ——— Fatturato dell'anno ——— */}
      <section className="card mb-6 overflow-hidden">
        <div className="grid gap-px bg-line lg:grid-cols-3">
          <div className="bg-white p-5 lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-mute">Fatturato {ANNO_CORRENTE}</p>
            <p className="display mt-1 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-ink sm:text-[48px]">{eur0(corrente?.fatturato ?? 0)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-ink-soft">
                <Variazione v={corrente?.crescita ?? null} className="text-base" />{' '}
                {periodo && <span className="text-xs text-ink-mute">su {periodo} {ANNO_CORRENTE - 1}</span>}
              </span>
              {precedente && <span className="text-xs text-ink-mute">{ANNO_CORRENTE - 1} intero: {eur0(precedente.fatturato)}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-1">
            <div className="bg-white p-4 lg:px-5">
              <p className="text-xs text-ink-soft">Margine {ANNO_CORRENTE}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">{eur0(margineCorr)}</p>
              <p className="text-xs text-ink-mute">{num(corrente?.fatturato ? (margineCorr / corrente.fatturato) * 100 : 0, 1)}% del fatturato</p>
            </div>
            <div className="bg-white p-4 lg:px-5">
              <p className="text-xs text-ink-soft">{MESI_LUNGHI[MESE_CORRENTE - 1]} (in corso)</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">{eur0(punto(ANNO_CORRENTE, MESE_CORRENTE)?.fatturato ?? 0)}</p>
              <p className="text-xs text-ink-mute">{MESI_LUNGHI[MESE_CORRENTE - 1]} {ANNO_CORRENTE - 1}: {eur0(punto(ANNO_CORRENTE - 1, MESE_CORRENTE)?.fatturato ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Da incassare dai clienti" value={eurK(daIncassareTot)} hint={`${vive.length} pratiche attive`} tone="brand" icon={<Euro size={16} />} />
        <Stat label="Scoperto da carte" value={eur0(carte.totale)} hint={carte.totale > 0 && prossimoAddebito ? `prossimo addebito ${fmtDateShort(prossimoAddebito)}` : 'Nessun anticipo da recuperare'} tone={carte.totale > 0 ? 'amber' : 'green'} icon={<CreditCard size={16} />} />
        <Stat label="Incassi scaduti" value={scaduti.length} hint={scaduti.length ? `${eur0(scaduti.reduce((s, x) => s + x.importo, 0))} da sollecitare` : 'Tutto in regola'} tone={scaduti.length ? 'red' : 'green'} icon={<AlertTriangle size={16} />} />
        <Stat label="Da pagare ai fornitori" value={eurK(daPagare30)} hint="nei prossimi 30 giorni" tone="blue" icon={<Euro size={16} />} />
      </div>

      {/* ——— Andamento: mesi e anni ——— */}
      <Card className="mb-6">
        <CardTitle
          sub="Fatturato mese per mese, confrontato con l’anno prima"
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Segmented options={[{ id: 'mesi', label: 'Mesi' }, { id: 'anni', label: 'Anni precedenti' }]} value={vista} onChange={setVista} />
              <button className="btn-ghost btn-sm" onClick={() => setImporta(true)}><Upload size={13} /> Importa storico</button>
            </div>
          }
        >
          Andamento
        </CardTitle>

        {vista === 'mesi' ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perMese.map((m) => ({ ...m, nome: MESI[m.mese - 1], corrente: m.mese <= MESE_CORRENTE ? m.corrente : null }))} margin={{ left: -6, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e1e8e6" />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => eur0(v)} cursor={{ fill: '#f4f7f7' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar name={String(ANNO_CORRENTE - 1)} dataKey="precedente" fill="#cbd6d3" radius={[3, 3, 0, 0]} />
                  <Bar name={String(ANNO_CORRENTE)} dataKey="corrente" fill="#0e7a86" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="th">Mese</th><th className="th text-right">{ANNO_CORRENTE}</th><th className="th text-right">{ANNO_CORRENTE - 1}</th><th className="th text-right">Crescita</th></tr></thead>
                <tbody>
                  {perMese.filter((m) => m.mese <= MESE_CORRENTE).reverse().map((m) => {
                    const incorso = m.mese === MESE_CORRENTE
                    return (
                      <tr key={m.mese}>
                        <td className="td font-medium">{m.nome} {incorso && <Badge className="ml-1">in corso</Badge>}</td>
                        <td className="td text-right tabular-nums">{eur0(m.corrente)}</td>
                        <td className="td text-right tabular-nums text-ink-soft">{eur0(m.precedente)}</td>
                        <td className="td text-right">{incorso ? <span className="text-xs text-ink-mute">mese non chiuso</span> : <Variazione v={variazione(m.corrente, m.precedente)} />}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Anno</th><th className="th text-right">Fatturato</th><th className="th text-right">Margine</th><th className="th text-right">% margine</th><th className="th text-right">Crescita</th></tr></thead>
              <tbody>
                {[...anni].reverse().map((a) => (
                  <tr key={a.anno}>
                    <td className="td font-medium">{a.anno} {a.anno === ANNO_CORRENTE && <Badge className="ml-1">in corso</Badge>}</td>
                    <td className="td text-right tabular-nums">{eur0(a.fatturato)}</td>
                    <td className="td text-right tabular-nums">{eur0(a.margine)}</td>
                    <td className="td text-right tabular-nums">{num(a.fatturato ? (a.margine / a.fatturato) * 100 : 0, 1)}%</td>
                    <td className="td text-right"><Variazione v={a.crescita} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink-mute">La crescita confronta gli stessi mesi dell’anno precedente. I dati fino a settembre 2026 sono quelli importati (in demo: fittizi); da lì in poi il fatturato si calcola dalle pratiche inserite nel gestionale.</p>
          </div>
        )}
      </Card>

      {/* ——— Carte dell'agenzia e scoperto ——— */}
      <Card className="mb-6">
        <CardTitle sub="Costi anticipati con le carte dell’agenzia, non ancora incassati dai clienti" right={<button className="btn-ghost btn-sm" onClick={() => setNuovaCarta('nuova')}><Plus size={13} /> Carta agenzia</button>}>Carte di credito e scoperto</CardTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          {carte.righe.map(({ carta, addebitato, scoperto, prossimo, limiteResiduo }) => (
            <div key={carta.id} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={15} className="text-ink-mute" /> {carta.circuito} {mascherata(carta)}</p>
                <button className="text-xs text-brand hover:underline" onClick={() => setCartaAperta(cartaAperta === carta.id ? null : carta.id)}>{cartaAperta === carta.id ? 'Chiudi' : 'Dettagli'}</button>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-ink-mute">Addebitato nel ciclo</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{eur0(addebitato)}</dd></div>
                <div><dt className="text-ink-mute">Scoperto</dt><dd className={cx('mt-0.5 text-sm font-semibold tabular-nums', scoperto > 0 ? 'text-amber2' : 'text-moss')}>{eur0(scoperto)}</dd></div>
                <div><dt className="text-ink-mute">Addebito in conto</dt><dd className="mt-0.5 text-sm font-semibold">{fmtDateShort(prossimo)}</dd></div>
              </dl>
              {carta.limite ? (
                <div className="mt-3">
                  <Progress value={(addebitato / carta.limite) * 100} tone={addebitato / carta.limite > 0.8 ? 'red' : 'brand'} />
                  <p className="mt-1 text-[11px] text-ink-mute">Disponibile {eur0(limiteResiduo ?? 0)} su {eur0(carta.limite)}</p>
                </div>
              ) : null}
              {cartaAperta === carta.id && (
                <div className="mt-3">
                  <CartaCard c={carta} onEdit={() => setNuovaCarta(carta)} onDelete={() => update((d) => ({ ...d, carte: d.carte.filter((x) => x.id !== carta.id) }))} />
                </div>
              )}
            </div>
          ))}
        </div>
        {carte.perPratica.filter((x) => x.scoperto > 0).length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Pratica con scoperto</th><th className="th text-right">Anticipato</th><th className="th text-right">Incassato</th><th className="th text-right">Da coprire</th></tr></thead>
              <tbody>
                {carte.perPratica.filter((x) => x.scoperto > 0).map((x) => (
                  <tr key={x.pratica.id}>
                    <td className="td"><Link to={`/pratiche/${x.pratica.id}`} className="font-medium hover:text-brand">{x.pratica.titolo}</Link><div className="text-xs text-ink-mute">{clienteDi(db, x.pratica)?.nome}</div></td>
                    <td className="td text-right tabular-nums">{eur0(x.anticipato)}</td>
                    <td className="td text-right tabular-nums">{eur0(x.incassato)}</td>
                    <td className="td text-right font-semibold tabular-nums text-amber2">{eur0(x.scoperto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ——— Lavoro di oggi ——— */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" pad={false}>
          <div className="p-5 pb-2">
            <CardTitle sub="Scaduto, oggi e prossimi 3 giorni" right={<Link to="/scadenzario" className="flex items-center gap-1 text-xs font-medium text-brand">Tutte <ArrowRight size={12} /></Link>}>Da fare</CardTitle>
          </div>
          {urgenti.length === 0 ? (
            <div className="p-5 pt-0"><Empty>Niente di urgente. Buon lavoro!</Empty></div>
          ) : (
            <ul className="divide-y divide-line">
              {urgenti.map((s) => {
                const d = daysFromToday(s.data)
                return (
                  <li key={s.id}>
                    <Link to={`/pratiche/${s.praticaId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas active:bg-canvas">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${d < 0 ? 'bg-rose2' : d === 0 ? 'bg-amber2' : 'bg-sky2'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.titolo}</p>
                        <p className="truncate text-xs text-ink-mute">{SCAD_LABEL[s.tipo]} · {s.dettaglio}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {s.importo !== undefined && <p className="text-sm font-semibold tabular-nums">{eur0(s.importo)}</p>}
                        <p className={`text-xs ${d < 0 ? 'font-medium text-rose2' : 'text-ink-mute'}`}>{relDays(s.data)}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold">Preventivi in attesa</h2>
          {preventivi.length === 0 ? <Empty>Nessun preventivo aperto.</Empty> : (
            <Card pad={false}>
              <ul className="divide-y divide-line">
                {preventivi.map((p) => {
                  const scad = p.validitaPreventivo ? daysFromToday(p.validitaPreventivo) : null
                  return (
                    <li key={p.id}>
                      <Link to={`/pratiche/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.titolo}</p>
                          <p className="truncate text-xs text-ink-mute">{clienteDi(db, p)?.nome}</p>
                        </div>
                        {scad !== null && <Badge tone={scad <= 3 ? 'red' : 'amber'}>{scad < 0 ? 'scaduto' : `scade ${relDays(p.validitaPreventivo!)}`}</Badge>}
                        <StatoBadge stato={p.stato} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[15px] font-semibold">Prossime partenze</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{partenze.map((p) => <PraticaCard key={p.id} p={p} db={db} />)}</div>
      </section>

      {importa && <ImportaStorico onClose={() => setImporta(false)} onImporta={(righe, fino) => { update((d) => ({ ...d, storico: [...d.storico.filter((x) => !righe.some((r) => r.anno === x.anno && r.mese === x.mese)), ...righe], storicoFino: fino })); setImporta(false) }} />}
      {nuovaCarta && <CartaModal key={nuovaCarta === 'nuova' ? 'n' : nuovaCarta.id} open onClose={() => setNuovaCarta(null)} carta={nuovaCarta === 'nuova' ? undefined : nuovaCarta} proprietario="agenzia" intestatario="Castruccio Viaggi srl" onSave={(k) => { update((d) => ({ ...d, carte: d.carte.some((x) => x.id === k.id) ? d.carte.map((x) => (x.id === k.id ? k : x)) : [...d.carte, k] })); setNuovaCarta(null) }} />}
    </>
  )
}

function ImportaStorico({ onClose, onImporta }: { onClose: () => void; onImporta: (righe: StoricoMese[], fino: string) => void }) {
  const [testo, setTesto] = useState('')
  const { righe, errori } = useMemo(() => parseStorico(testo), [testo])
  const ordinate = [...righe].sort((a, b) => a.anno - b.anno || a.mese - b.mese)
  const ultimo = ordinate[ordinate.length - 1]
  const fino = ultimo ? `${ultimo.anno}-${String(ultimo.mese).padStart(2, '0')}-${String(new Date(ultimo.anno, ultimo.mese, 0).getDate()).padStart(2, '0')}` : ''
  const anniTrovati = [...new Set(ordinate.map((r) => r.anno))]

  return (
    <Modal open onClose={onClose} title="Importa lo storico dal vecchio gestionale" wide footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!righe.length} onClick={() => onImporta(ordinate, fino)}>Importa {righe.length} mesi</button></>}>
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Una riga per ogni mese, con anno, mese, fatturato e (facoltativo) margine. Separatore <code>;</code> o virgola. I mesi già presenti vengono sostituiti.</p>
        <pre className="overflow-x-auto rounded-lg bg-canvas p-3 text-xs">{`anno;mese;fatturato;margine
2023;1;71200;8300
2023;2;64850,50;7600
2023;3;65000`}</pre>
        <Field label="Carica un file CSV">
          <input type="file" accept=".csv,.txt,text/csv" className="block w-full text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setTesto(await f.text()) }} />
        </Field>
        <Field label="…oppure incolla i dati qui"><textarea className="input min-h-32 font-mono text-xs" value={testo} onChange={(e) => setTesto(e.target.value)} placeholder="anno;mese;fatturato;margine" /></Field>
        {testo.trim() && (
          <div className={cx('rounded-lg px-3 py-2 text-xs', righe.length ? 'bg-moss-soft text-moss' : 'bg-rose2-soft text-rose2')}>
            {righe.length ? <>Trovati <strong>{righe.length}</strong> mesi ({anniTrovati.join(', ')}). Lo storico arriverà fino al <strong>{fino}</strong>: dopo quella data il fatturato si calcola dalle pratiche.</> : 'Nessuna riga valida.'}
            {errori.length > 0 && <ul className="mt-1 list-disc pl-4 text-rose2">{errori.slice(0, 4).map((e) => <li key={e}>{e}</li>)}{errori.length > 4 && <li>…e altre {errori.length - 4}</li>}</ul>}
          </div>
        )}
      </div>
    </Modal>
  )
}
