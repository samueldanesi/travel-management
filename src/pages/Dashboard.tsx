import { AlertTriangle, ArrowRight, CalendarClock, Euro, Plane, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PraticaCard, StatoBadge, clienteDi } from '../components/shared'
import { Badge, Card, CardTitle, Empty, PageHeader, Stat } from '../components/ui'
import { attiva, daIncassare, margine, pagamentiScaduti, problemiDocumenti, SCAD_LABEL, scadenze } from '../lib/calc'
import { daysFromToday, eur0, eurK, fmtDateShort, parse, relDays, TODAY } from '../lib/format'
import { useStore } from '../store'

export default function Dashboard() {
  const { db } = useStore()
  const vive = db.pratiche.filter((p) => p.stato === 'confermata' || p.stato === 'saldata' || p.stato === 'in_viaggio')

  const kpi = useMemo(() => {
    const scaduti = db.pratiche.filter((p) => p.stato !== 'annullata').flatMap(pagamentiScaduti)
    const margineAnno = db.pratiche.filter((p) => p.stato !== 'annullata' && p.stato !== 'preventivo').reduce((s, p) => s + margine(p), 0)
    return {
      attive: vive.length,
      preventivi: db.pratiche.filter((p) => p.stato === 'preventivo').length,
      daIncassare: vive.reduce((s, p) => s + daIncassare(p), 0),
      scaduti: scaduti.length,
      importoScaduto: scaduti.reduce((s, x) => s + x.importo, 0),
      margineAnno,
      partenze30: db.pratiche.filter((p) => attiva(p) && p.stato !== 'in_viaggio' && p.stato !== 'preventivo' && daysFromToday(p.partenza) >= 0 && daysFromToday(p.partenza) <= 30).length,
    }
  }, [db, vive])

  const urgenti = useMemo(() => scadenze(db).filter((s) => daysFromToday(s.data) <= 3).slice(0, 7), [db])
  const partenze = db.pratiche
    .filter((p) => (p.stato === 'confermata' || p.stato === 'saldata') && daysFromToday(p.partenza) >= 0)
    .sort((a, b) => a.partenza.localeCompare(b.partenza))
    .slice(0, 4)
  const preventivi = db.pratiche.filter((p) => p.stato === 'preventivo').sort((a, b) => (a.validitaPreventivo ?? '').localeCompare(b.validitaPreventivo ?? ''))
  const inViaggio = db.pratiche.filter((p) => p.stato === 'in_viaggio')

  const perMese = useMemo(() => {
    const mesi: { mese: string; margine: number }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + i, 1)
      const m = db.pratiche
        .filter((p) => p.stato !== 'annullata' && p.stato !== 'preventivo' && parse(p.partenza).getMonth() === d.getMonth() && parse(p.partenza).getFullYear() === d.getFullYear())
        .reduce((s, p) => s + margine(p), 0)
      mesi.push({ mese: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(d), margine: Math.round(m) })
    }
    return mesi
  }, [db])

  const ora = new Date().getHours()
  const saluto = ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <>
      <PageHeader title={`${saluto}, Giulia`} subtitle={new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(TODAY)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Da incassare" value={eurK(kpi.daIncassare)} hint={`${kpi.attive} pratiche attive`} tone="brand" icon={<Euro size={16} />} />
        <Stat label="Incassi scaduti" value={kpi.scaduti} hint={kpi.scaduti ? `${eur0(kpi.importoScaduto)} da sollecitare` : 'Tutto in regola'} tone={kpi.scaduti ? 'red' : 'green'} icon={<AlertTriangle size={16} />} />
        <Stat label="Partenze nei 30 giorni" value={kpi.partenze30} hint={`${inViaggio.length} in viaggio ora`} tone="blue" icon={<Plane size={16} />} />
        <Stat label="Margine pratiche vive" value={eurK(kpi.margineAnno)} hint={`${kpi.preventivi} preventivi aperti`} tone="green" icon={<TrendingUp size={16} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
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

        <Card className="lg:col-span-2">
          <CardTitle sub="Per mese di partenza, pratiche confermate">Margine previsto</CardTitle>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMese} margin={{ left: -14, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="#e1e8e6" />
                <XAxis dataKey="mese" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => eur0(v)} cursor={{ fill: '#f4f7f7' }} />
                <Bar dataKey="margine" fill="#0e7a86" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Prossime partenze</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{partenze.map((p) => <PraticaCard key={p.id} p={p} db={db} />)}</div>
        </section>
        <section>
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

      {inViaggio.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-ink-mute">
          <CalendarClock size={14} /> In viaggio adesso: {inViaggio.map((p) => `${p.destinazione} (rientro ${fmtDateShort(p.rientro)})`).join(' · ')}
          {inViaggio.some((p) => problemiDocumenti(p).length) && ' — controllare i documenti'}
        </p>
      )}
    </>
  )
}
