import { AlertTriangle, CreditCard, Eye, EyeOff, Copy, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Carta } from '../data/types'
import { circuitoDa, formattaNumero, luhnOk, mascherata, soloCifre, statoScadenza } from '../lib/finanza'
import { cx, eur0, uid } from '../lib/format'
import { Badge, Field, Modal } from './ui'

const GRADIENTI: Record<Carta['circuito'], string> = {
  Visa: 'from-[#1a3a6b] to-[#2f6690]',
  Mastercard: 'from-[#3a2a2a] to-[#b0502a]',
  'American Express': 'from-[#0e5a66] to-[#1fa0ad]',
  Altra: 'from-[#33403e] to-[#6b7a77]',
}

export function ScadenzaBadge({ c }: { c: Carta }) {
  const st = statoScadenza(c)
  if (st === 'scaduta') return <Badge tone="red"><AlertTriangle size={11} /> scaduta {c.scadenza}</Badge>
  if (st === 'in_scadenza') return <Badge tone="amber">scade {c.scadenza}</Badge>
  return <span className="text-[11px] text-ink-mute">scade {c.scadenza}</span>
}

/** Carta con numero mascherato: "Mostra" svela numero e CVV, "Copia" li mette negli appunti */
export function CartaCard({ c, onEdit, onDelete, children }: { c: Carta; onEdit?: () => void; onDelete?: () => void; children?: React.ReactNode }) {
  const [vedi, setVedi] = useState(false)
  const [copiato, setCopiato] = useState(false)
  const copia = async () => {
    try {
      await navigator.clipboard.writeText(soloCifre(c.numero))
      setCopiato(true)
      setTimeout(() => setCopiato(false), 1500)
    } catch { /* appunti non disponibili */ }
  }
  return (
    <div className="card overflow-hidden">
      <div className={cx('bg-gradient-to-br p-4 text-white', GRADIENTI[c.circuito])}>
        <div className="flex items-start justify-between">
          <span className="text-sm font-semibold tracking-wide">{c.circuito}</span>
          <CreditCard size={20} className="opacity-80" />
        </div>
        <p className="mt-4 font-mono text-[17px] tracking-[0.12em]">{vedi ? formattaNumero(c.numero) : mascherata(c)}</p>
        <div className="mt-3 flex items-end justify-between gap-3 text-xs">
          <span className="truncate uppercase tracking-wide opacity-90">{c.intestatario}</span>
          <span className="shrink-0 font-mono opacity-90">{c.scadenza}{vedi && c.cvv && <> · CVV {c.cvv}</>}</span>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ScadenzaBadge c={c} />
          {c.limite ? <span className="text-[11px] text-ink-mute">limite {eur0(c.limite)}</span> : null}
          {c.giornoAddebito ? <span className="text-[11px] text-ink-mute">addebito il {c.giornoAddebito} del mese</span> : null}
        </div>
        {c.note && <p className="text-xs text-ink-soft">{c.note}</p>}
        {children}
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="btn-ghost btn-sm" onClick={() => setVedi((v) => !v)}>{vedi ? <><EyeOff size={13} /> Nascondi</> : <><Eye size={13} /> Mostra</>}</button>
          <button className="btn-ghost btn-sm" onClick={copia}><Copy size={13} /> {copiato ? 'Copiato' : 'Copia numero'}</button>
          {onEdit && <button className="btn-ghost btn-sm" onClick={onEdit}><Pencil size={13} /> Modifica</button>}
          {onDelete && <button className="btn-ghost btn-sm text-rose2" onClick={() => { if (confirm('Eliminare questa carta?')) onDelete() }}><Trash2 size={13} /> Elimina</button>}
        </div>
      </div>
    </div>
  )
}

export function AvvisoDemoCarte() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber2-soft px-3 py-2 text-xs text-amber2">
      <ShieldAlert size={15} className="mt-0.5 shrink-0" />
      <span><strong>Solo demo.</strong> I dati restano nel browser, non in un archivio protetto: usa numeri di prova (es. 4111 1111 1111 1111). Nel gestionale vero le carte vanno salvate cifrate, con accesso solo al personale autorizzato.</span>
    </div>
  )
}

export function BottoneNuovaCarta({ onClick }: { onClick: () => void }) {
  return <button className="btn-ghost w-full" onClick={onClick}><Plus size={15} /> Aggiungi carta</button>
}

export function CartaModal({ open, onClose, carta, proprietario, intestatario, onSave }: { open: boolean; onClose: () => void; carta?: Carta; proprietario: string; intestatario: string; onSave: (c: Carta) => void }) {
  const [numero, setNumero] = useState(carta ? formattaNumero(carta.numero) : '')
  const [scadenza, setScadenza] = useState(carta?.scadenza ?? '')
  const [nome, setNome] = useState(carta?.intestatario ?? intestatario)
  const [cvv, setCvv] = useState(carta?.cvv ?? '')
  const [limite, setLimite] = useState(carta?.limite ? String(carta.limite) : '')
  const [giorno, setGiorno] = useState(carta?.giornoAddebito ? String(carta.giornoAddebito) : '')
  const [note, setNote] = useState(carta?.note ?? '')
  const cifre = soloCifre(numero)
  const circuito = circuitoDa(numero)
  const agenzia = proprietario === 'agenzia'
  const scadOk = /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(scadenza.trim())
  const ok = cifre.length >= 12 && scadOk && nome.trim()

  const cambiaScadenza = (v: string) => {
    const d = v.replace(/[^\d]/g, '').slice(0, 4)
    setScadenza(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
  }
  const salva = () =>
    onSave({
      id: carta?.id ?? uid('k'), proprietario, intestatario: nome.trim(), circuito, numero: cifre, scadenza: scadenza.trim(), cvv: cvv.trim() || undefined,
      limite: Number(limite) > 0 ? Number(limite) : undefined, giornoAddebito: agenzia && Number(giorno) > 0 ? Math.min(28, Number(giorno)) : undefined, note: note.trim() || undefined,
    })

  return (
    <Modal open={open} onClose={onClose} title={carta ? 'Modifica carta' : 'Nuova carta'} footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!ok} onClick={salva}>Salva carta</button></>}>
      <div className="space-y-3">
        <AvvisoDemoCarte />
        <Field label="Numero della carta" hint={cifre.length >= 12 ? `${circuito}${luhnOk(numero) ? '' : ' · il numero sembra errato, ricontrolla'}` : undefined}>
          <input className="input font-mono" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" value={numero} onChange={(e) => setNumero(formattaNumero(e.target.value.slice(0, 23)))} />
        </Field>
        <Field label="Intestatario"><input className="input" autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scadenza (MM/AA)"><input className="input font-mono" inputMode="numeric" autoComplete="off" placeholder="08/28" value={scadenza} onChange={(e) => cambiaScadenza(e.target.value)} /></Field>
          <Field label="CVV"><input className="input font-mono" inputMode="numeric" autoComplete="off" maxLength={4} value={cvv} onChange={(e) => setCvv(soloCifre(e.target.value))} /></Field>
        </div>
        <div className={cx('grid gap-3', agenzia ? 'grid-cols-2' : 'grid-cols-1')}>
          <Field label="Limite di spesa (€, facoltativo)"><input type="number" inputMode="decimal" className="input" value={limite} onChange={(e) => setLimite(e.target.value)} /></Field>
          {agenzia && <Field label="Giorno di addebito in conto"><input type="number" min={1} max={28} className="input" placeholder="15" value={giorno} onChange={(e) => setGiorno(e.target.value)} /></Field>}
        </div>
        <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. usare per voli e hotel" /></Field>
      </div>
    </Modal>
  )
}
