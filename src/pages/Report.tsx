import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardTitle, PageHeader, Stat } from '../components/ui'
import { ivaPratica, margine, TIPO_LABEL, totRicavo } from '../lib/calc'
import { eur0, num, parse } from '../lib/format'
import { useStore } from '../store'

export default function Report() {
  const { db } = useStore()
  const reali = useMemo(() => db.pratiche.filter((p) => p.stato !== 'annullata' && p.stato !== 'preventivo'), [db])
  const venduto = reali.reduce((s, p) => s + totRicavo(p), 0)
  const marg = reali.reduce((s, p) => s + margine(p), 0)
  const iva = reali.reduce((s, p) => s + ivaPratica(p), 0)

  const perOperatore = db.operatori.map((o) => {
    const mie = reali.filter((p) => p.operatoreId === o.id)
    return { nome: o.nome.split(' ')[0], venduto: Math.round(mie.reduce((s, p) => s + totRicavo(p), 0)), margine: Math.round(mie.reduce((s, p) => s + margine(p), 0)) }
  })
  const perTipo = Object.entries(
    reali.flatMap((p) => p.servizi).reduce<Record<string, number>>((m, s) => ({ ...m, [TIPO_LABEL[s.tipo]]: (m[TIPO_LABEL[s.tipo]] ?? 0) + (s.ricavo - s.costo) }), {})
  ).map(([nome, margine]) => ({ nome, margine: Math.round(margine) })).sort((a, b) => b.margine - a.margine)
  const perMese = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of reali) {
      const d = parse(p.partenza)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      m.set(k, (m.get(k) ?? 0) + margine(p))
    }
    return [...m.entries()].sort().map(([k, v]) => ({ mese: new Intl.DateTimeFormat('it-IT', { month: 'short', year: '2-digit' }).format(parse(`${k}-01`)), margine: Math.round(v) }))
  }, [reali])

  const axis = { tickLine: false, axisLine: false, fontSize: 12 } as const
  return (
    <>
      <PageHeader title="Report" subtitle="Cosa rende davvero l’agenzia: margine per mese, operatore e tipo di servizio." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Venduto" value={eur0(venduto)} tone="brand" hint={`${reali.length} pratiche`} />
        <Stat label="Margine lordo" value={eur0(marg)} tone="green" hint={`${num(venduto ? (marg / venduto) * 100 : 0, 1)}% del venduto`} />
        <Stat label="IVA stimata" value={eur0(iva)} tone="amber" hint="sul margine, indicativa" />
        <Stat label="Margine netto IVA" value={eur0(marg - iva)} tone="blue" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Per mese di partenza">Margine nel tempo</CardTitle>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={perMese} margin={{ left: -14 }}><CartesianGrid vertical={false} stroke="#e1e8e6" /><XAxis dataKey="mese" {...axis} /><YAxis {...axis} tickFormatter={(v) => `${v / 1000}k`} /><Tooltip formatter={(v: number) => eur0(v)} cursor={{ fill: '#f4f7f7' }} /><Bar dataKey="margine" fill="#0e7a86" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardTitle sub="Quanto guadagna l’agenzia per tipo di servizio">Margine per tipo</CardTitle>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={perTipo} layout="vertical" margin={{ left: 20 }}><CartesianGrid horizontal={false} stroke="#e1e8e6" /><XAxis type="number" {...axis} tickFormatter={(v) => `${v / 1000}k`} /><YAxis type="category" dataKey="nome" {...axis} width={90} /><Tooltip formatter={(v: number) => eur0(v)} cursor={{ fill: '#f4f7f7' }} /><Bar dataKey="margine" fill="#2f7d5b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle sub="Pratiche confermate o concluse">Per operatore</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Operatore</th><th className="th text-right">Venduto</th><th className="th text-right">Margine</th></tr></thead>
              <tbody>{perOperatore.map((o) => <tr key={o.nome}><td className="td font-medium">{o.nome}</td><td className="td text-right tabular-nums">{eur0(o.venduto)}</td><td className="td text-right tabular-nums">{eur0(o.margine)}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>
      <p className="mt-6 text-xs text-ink-mute">Le cifre di IVA sono una stima a scopo dimostrativo: il calcolo fiscale ufficiale va fatto con la contabilità dell’agenzia.</p>
    </>
  )
}
