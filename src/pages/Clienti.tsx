import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, Empty, Field, Modal, PageHeader } from '../components/ui'
import type { Cliente } from '../data/types'
import { totRicavo } from '../lib/calc'
import { eur0, uid } from '../lib/format'
import { useStore } from '../store'

export default function Clienti() {
  const { db, update } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const righe = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.clienti
      .filter((c) => !s || c.nome.toLowerCase().includes(s) || c.citta.toLowerCase().includes(s))
      .map((c) => {
        const mie = db.pratiche.filter((p) => p.clienteId === c.id && p.stato !== 'annullata' && p.stato !== 'preventivo')
        return { c, n: mie.length, venduto: mie.reduce((t, p) => t + totRicavo(p), 0), aperti: db.pratiche.filter((p) => p.clienteId === c.id && p.stato === 'preventivo').length }
      })
      .sort((a, b) => b.venduto - a.venduto)
  }, [db, q])

  return (
    <>
      <PageHeader title="Clienti" subtitle="Storico viaggi, contatti e preferenze." actions={<button className="btn-brand" onClick={() => setOpen(true)}><Plus size={16} /> Nuovo cliente</button>} />
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input className="input pl-9" placeholder="Cerca per nome o città" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {righe.length === 0 ? <Empty>Nessun cliente trovato.</Empty> : (
        <>
          <div className="grid gap-3 md:hidden">
            {righe.map(({ c, n, venduto, aperti }) => (
              <Link key={c.id} to={`/clienti/${c.id}`} className="card block p-4 active:bg-canvas">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.nome}</p>
                  {c.tipo === 'azienda' && <Badge tone="blue">Azienda</Badge>}
                </div>
                <p className="text-xs text-ink-mute">{c.citta} · {c.tel}</p>
                <p className="mt-2 text-xs text-ink-soft">{n} viaggi · {eur0(venduto)}{aperti > 0 && ` · ${aperti} preventivo/i aperto/i`}</p>
              </Link>
            ))}
          </div>
          <Card pad={false} className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Cliente</th><th className="th">Città</th><th className="th">Telefono</th><th className="th text-right">Viaggi</th><th className="th text-right">Venduto</th></tr></thead>
              <tbody>
                {righe.map(({ c, n, venduto, aperti }) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-canvas" onClick={() => nav(`/clienti/${c.id}`)}>
                    <td className="td"><Link to={`/clienti/${c.id}`} className="font-medium hover:text-brand">{c.nome}</Link> {c.tipo === 'azienda' && <Badge tone="blue" className="ml-1">Azienda</Badge>}{aperti > 0 && <Badge tone="amber" className="ml-1">{aperti} preventivo</Badge>}</td>
                    <td className="td">{c.citta}</td>
                    <td className="td whitespace-nowrap">{c.tel}</td>
                    <td className="td text-right tabular-nums">{n}</td>
                    <td className="td text-right tabular-nums">{eur0(venduto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <NuovoCliente open={open} onClose={() => setOpen(false)} onAdd={(c) => { update((d) => ({ ...d, clienti: [c, ...d.clienti] })); setOpen(false); nav(`/clienti/${c.id}`) }} />
    </>
  )
}

function NuovoCliente({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Cliente) => void }) {
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [citta, setCitta] = useState('')
  const [tipo, setTipo] = useState<Cliente['tipo']>('privato')
  return (
    <Modal open={open} onClose={onClose} title="Nuovo cliente" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!nome.trim() || !tel.trim()} onClick={() => { onAdd({ id: uid('c'), nome: nome.trim(), tel: tel.trim(), email: email.trim(), citta: citta.trim(), tipo }); setNome(''); setTel(''); setEmail(''); setCitta('') }}>Salva</button></>}>
      <div className="space-y-3">
        <Field label="Nome e cognome (o ragione sociale)"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefono"><input type="tel" className="input" value={tel} onChange={(e) => setTel(e.target.value)} /></Field>
          <Field label="Città"><input className="input" value={citta} onChange={(e) => setCitta(e.target.value)} /></Field>
        </div>
        <Field label="Email"><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Tipo"><select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as Cliente['tipo'])}><option value="privato">Privato</option><option value="azienda">Azienda</option></select></Field>
      </div>
    </Modal>
  )
}
