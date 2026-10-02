import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, Empty, Field, Modal, PageHeader, Tabs } from '../components/ui'
import type { CategoriaBusiness, Cliente, Segmento } from '../data/types'
import { margine, totRicavo } from '../lib/calc'
import { CATEGORIA_LABEL, INTERESSI } from '../lib/segmenti'
import { cx, eur0, uid } from '../lib/format'
import { useStore } from '../store'

type Vista = Segmento | 'tutti'

export default function Clienti() {
  const { db, update } = useStore()
  const nav = useNavigate()
  const [vista, setVista] = useState<Vista>('vacanze')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const righe = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.clienti
      .filter((c) => vista === 'tutti' || c.segmento === vista)
      .filter((c) => !s || c.nome.toLowerCase().includes(s) || c.citta.toLowerCase().includes(s) || (c.organizzazione ?? '').toLowerCase().includes(s) || (c.ruolo ?? '').toLowerCase().includes(s))
      .map((c) => {
        const mie = db.pratiche.filter((p) => p.clienteId === c.id && p.stato !== 'annullata' && p.stato !== 'preventivo')
        return { c, n: mie.length, venduto: mie.reduce((t, p) => t + totRicavo(p), 0), margine: mie.reduce((t, p) => t + margine(p), 0), aperti: db.pratiche.filter((p) => p.clienteId === c.id && p.stato === 'preventivo').length }
      })
      .sort((a, b) => b.venduto - a.venduto)
  }, [db, q, vista])

  const conta = (s: Vista) => (s === 'tutti' ? db.clienti.length : db.clienti.filter((c) => c.segmento === s).length)
  const biz = vista === 'business'

  return (
    <>
      <PageHeader
        title="Clienti"
        subtitle="Due mondi diversi: chi parte per una vacanza e chi viaggia per lavoro."
        actions={<button className="btn-brand" onClick={() => setOpen(true)}><Plus size={16} /> Nuovo cliente</button>}
      />
      <Tabs<Vista>
        tabs={[
          { id: 'vacanze', label: 'Viaggi vacanze', badge: <Badge>{conta('vacanze')}</Badge> },
          { id: 'business', label: 'Professionisti', badge: <Badge>{conta('business')}</Badge> },
          { id: 'tutti', label: 'Tutti', badge: <Badge>{conta('tutti')}</Badge> },
        ]}
        value={vista}
        onChange={setVista}
      />
      <p className="mb-4 mt-3 text-xs text-ink-soft">
        {vista === 'vacanze' && 'Famiglie, coppie e gruppi: contano preferenze di viaggio, periodi e budget.'}
        {vista === 'business' && 'Manager, imprenditori, sportivi e aziende: contano riservatezza, flessibilità delle tariffe e la persona di riferimento.'}
        {vista === 'tutti' && 'Tutti i clienti dell’agenzia.'}
      </p>
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input className="input pl-9" placeholder={biz ? 'Cerca per nome, ruolo o azienda' : 'Cerca per nome o città'} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {righe.length === 0 ? <Empty>Nessun cliente trovato.</Empty> : (
        <>
          <div className="grid gap-3 md:hidden">
            {righe.map(({ c, n, venduto, aperti }) => (
              <Link key={c.id} to={`/clienti/${c.id}`} className="card block p-4 active:bg-canvas">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.nome}</p>
                  {vista === 'tutti' && <Badge tone={c.segmento === 'business' ? 'blue' : 'brand'}>{c.segmento === 'business' ? 'Professionista' : 'Vacanze'}</Badge>}
                </div>
                <p className="text-xs text-ink-mute">{c.segmento === 'business' ? [c.ruolo, c.organizzazione].filter(Boolean).join(' · ') : c.citta}</p>
                {c.segmento === 'vacanze' && c.interessi.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.interessi.map((i) => <Badge key={i}>{i}</Badge>)}</div>}
                <p className="mt-2 text-xs text-ink-soft">{n} viaggi · {eur0(venduto)}{aperti > 0 && ` · ${aperti} preventivo/i aperto/i`}</p>
              </Link>
            ))}
          </div>

          <Card pad={false} className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Cliente</th>
                  {vista === 'tutti' && <th className="th">Segmento</th>}
                  {biz ? <><th className="th">Ruolo e organizzazione</th><th className="th">Referente</th></> : vista === 'vacanze' ? <><th className="th">Città</th><th className="th">Interessi</th></> : <th className="th">Dettagli</th>}
                  <th className="th text-right">Viaggi</th>
                  <th className="th text-right">Venduto</th>
                  {biz && <th className="th text-right">Margine</th>}
                </tr>
              </thead>
              <tbody>
                {righe.map(({ c, n, venduto, margine: m, aperti }) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-canvas" onClick={() => nav(`/clienti/${c.id}`)}>
                    <td className="td">
                      <Link to={`/clienti/${c.id}`} className="font-medium hover:text-brand">{c.nome}</Link>
                      {aperti > 0 && <Badge tone="amber" className="ml-2">{aperti} preventivo</Badge>}
                      {c.categoria && vista !== 'business' && <div className="text-xs text-ink-mute">{CATEGORIA_LABEL[c.categoria]}</div>}
                    </td>
                    {vista === 'tutti' && <td className="td"><Badge tone={c.segmento === 'business' ? 'blue' : 'brand'}>{c.segmento === 'business' ? 'Professionista' : 'Vacanze'}</Badge></td>}
                    {biz ? (
                      <>
                        <td className="td"><div>{c.categoria && <Badge tone="blue" className="mr-1.5">{CATEGORIA_LABEL[c.categoria]}</Badge>}{c.ruolo}</div>{c.organizzazione && <div className="text-xs text-ink-mute">{c.organizzazione}</div>}</td>
                        <td className="td text-ink-soft">{c.referente ?? '—'}</td>
                      </>
                    ) : vista === 'vacanze' ? (
                      <>
                        <td className="td">{c.citta}</td>
                        <td className="td"><div className="flex flex-wrap gap-1">{c.interessi.map((i) => <Badge key={i}>{i}</Badge>)}</div></td>
                      </>
                    ) : (
                      <td className="td text-ink-soft">{c.segmento === 'business' ? [c.ruolo, c.organizzazione].filter(Boolean).join(' · ') : c.citta}</td>
                    )}
                    <td className="td text-right tabular-nums">{n}</td>
                    <td className="td text-right tabular-nums">{eur0(venduto)}</td>
                    {biz && <td className="td text-right tabular-nums">{eur0(m)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <NuovoCliente
        open={open}
        iniziale={vista === 'business' ? 'business' : 'vacanze'}
        onClose={() => setOpen(false)}
        onAdd={(c) => { update((d) => ({ ...d, clienti: [c, ...d.clienti] })); setOpen(false); nav(`/clienti/${c.id}`) }}
      />
    </>
  )
}

function NuovoCliente({ open, iniziale, onClose, onAdd }: { open: boolean; iniziale: Segmento; onClose: () => void; onAdd: (c: Cliente) => void }) {
  const [segmento, setSegmento] = useState<Segmento>(iniziale)
  const [nome, setNome] = useState('')
  const [saluto, setSaluto] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [citta, setCitta] = useState('')
  const [interessi, setInteressi] = useState<string[]>([])
  const [categoria, setCategoria] = useState<CategoriaBusiness>('manager')
  const [ruolo, setRuolo] = useState('')
  const [org, setOrg] = useState('')
  const [referente, setReferente] = useState('')
  const [marketing, setMarketing] = useState(false)
  const biz = segmento === 'business'

  const salva = () => {
    onAdd({
      id: uid('c'), nome: nome.trim(), segmento, saluto: saluto.trim() || nome.trim().split(' ')[0], tel: tel.trim(), email: email.trim(), citta: citta.trim(),
      interessi: biz ? [] : interessi, marketing: !biz && marketing && !!email.trim(),
      ...(biz ? { categoria, ruolo: ruolo.trim() || undefined, organizzazione: org.trim() || undefined, referente: referente.trim() || undefined } : {}),
    })
    setNome(''); setSaluto(''); setTel(''); setEmail(''); setCitta(''); setInteressi([]); setRuolo(''); setOrg(''); setReferente(''); setMarketing(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuovo cliente" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!nome.trim() || !tel.trim()} onClick={salva}>Salva</button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(['vacanze', 'business'] as Segmento[]).map((s) => (
            <button key={s} type="button" onClick={() => setSegmento(s)} className={cx('rounded-lg border px-3 py-2.5 text-left text-sm transition', segmento === s ? 'border-brand bg-brand-soft font-semibold text-brand-dark' : 'border-line-strong bg-white text-ink-soft')}>
              {s === 'vacanze' ? 'Viaggi vacanze' : 'Professionista'}
              <span className="block text-[11px] font-normal text-ink-mute">{s === 'vacanze' ? 'Famiglie, coppie, gruppi' : 'Manager, sportivi, aziende'}</span>
            </button>
          ))}
        </div>
        <Field label={biz ? 'Nome e cognome o ragione sociale' : 'Nome e cognome'}><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
        <Field label="Come ci si rivolge nelle email" hint="Es. “famiglia Rossi”, “dott. Ferretti”, “Andrea e Sofia”"><input className="input" value={saluto} onChange={(e) => setSaluto(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefono"><input type="tel" className="input" value={tel} onChange={(e) => setTel(e.target.value)} /></Field>
          <Field label="Città"><input className="input" value={citta} onChange={(e) => setCitta(e.target.value)} /></Field>
        </div>
        <Field label={biz ? 'Email (anche della segreteria o dell’agente)' : 'Email'}><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>

        {biz ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria"><select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaBusiness)}>{(Object.keys(CATEGORIA_LABEL) as CategoriaBusiness[]).map((k) => <option key={k} value={k}>{CATEGORIA_LABEL[k]}</option>)}</select></Field>
              <Field label="Ruolo"><input className="input" value={ruolo} onChange={(e) => setRuolo(e.target.value)} placeholder="Es. Direttore commerciale" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organizzazione"><input className="input" value={org} onChange={(e) => setOrg(e.target.value)} /></Field>
              <Field label="Referente"><input className="input" value={referente} onChange={(e) => setReferente(e.target.value)} placeholder="Assistente o agente" /></Field>
            </div>
          </>
        ) : (
          <Field label="Interessi di viaggio">
            <div className="flex flex-wrap gap-1.5">
              {INTERESSI.map((i) => (
                <button key={i} type="button" onClick={() => setInteressi((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))} className={cx('rounded-full border px-2.5 py-1 text-xs font-medium transition', interessi.includes(i) ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line-strong text-ink-soft')}>{i}</button>
              ))}
            </div>
          </Field>
        )}
        {!biz && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={marketing} disabled={!email.trim()} onChange={(e) => setMarketing(e.target.checked)} /> <span>Ha dato il consenso a ricevere email promozionali<span className="block text-[11px] text-ink-mute">Senza consenso non riceverà le campagne di email marketing.</span></span></label>}
      </div>
    </Modal>
  )
}
