import { Card, PageHeader } from '../components/ui'
import { eur0 } from '../lib/format'
import { useStore } from '../store'

export default function Fornitori() {
  const { db } = useStore()
  const righe = db.fornitori.map((f) => {
    const serv = db.pratiche.filter((p) => p.stato !== 'annullata').flatMap((p) => p.servizi.filter((s) => s.fornitoreId === f.id))
    return {
      f,
      n: serv.length,
      venduto: serv.reduce((s, x) => s + x.ricavo, 0),
      margine: serv.reduce((s, x) => s + x.ricavo - x.costo, 0),
      daPagare: serv.filter((x) => !x.pagatoFornitore).reduce((s, x) => s + x.costo, 0),
    }
  })
  return (
    <>
      <PageHeader title="Fornitori" subtitle="Tour operator, compagnie, hotel: quanto vendi, quanto devi pagare, commissioni." />
      <div className="grid gap-3 md:hidden">
        {righe.map(({ f, n, venduto, daPagare }) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-start justify-between gap-2"><p className="font-semibold">{f.nome}</p><span className="text-xs text-ink-mute">{f.tipo}</span></div>
            <p className="mt-1 text-xs text-ink-soft">{n} servizi · venduto {eur0(venduto)}</p>
            <p className="mt-1 text-xs font-medium">{daPagare > 0 ? <span className="text-amber2">Da pagare: {eur0(daPagare)}</span> : <span className="text-moss">Nessun pagamento aperto</span>}</p>
            <a href={`tel:${f.tel.replace(/\s/g, '')}`} className="mt-2 inline-block text-xs text-brand">{f.tel}</a>
          </div>
        ))}
      </div>
      <Card pad={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Fornitore</th><th className="th">Tipo</th><th className="th text-right">Commissione</th><th className="th text-right">Servizi</th><th className="th text-right">Venduto</th><th className="th text-right">Margine</th><th className="th text-right">Da pagare</th></tr></thead>
          <tbody>
            {righe.map(({ f, n, venduto, margine, daPagare }) => (
              <tr key={f.id}>
                <td className="td"><div className="font-medium">{f.nome}</div><div className="text-xs text-ink-mute">{f.email}</div></td>
                <td className="td">{f.tipo}</td>
                <td className="td text-right tabular-nums">{f.commissione}%</td>
                <td className="td text-right tabular-nums">{n}</td>
                <td className="td text-right tabular-nums">{eur0(venduto)}</td>
                <td className="td text-right tabular-nums">{eur0(margine)}</td>
                <td className={`td text-right tabular-nums ${daPagare > 0 ? 'font-medium text-amber2' : 'text-ink-mute'}`}>{eur0(daPagare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
