import { useState } from 'react'
import type { Cliente, Pratica, Segmento } from '../data/types'
import { cx, dayOffset, uid } from '../lib/format'
import { useStore } from '../store'
import { Field, Modal } from './ui'

const NOME_SEGMENTO: Record<Segmento, string> = { vacanze: 'Vacanze', business: 'Professionista' }

/**
 * Nuovo preventivo: nasce come pratica in stato "preventivo", nella sezione giusta (vacanze o professionisti).
 * Se `segmento` è fissato (si parte da una sezione) il tipo di cliente non si sceglie; dalla pagina Preventivi sì.
 */
export function NuovaPratica({ segmento, onClose, onCreate }: { segmento?: Segmento; onClose: () => void; onCreate: (p: Pratica, nuovoCliente?: Cliente) => void }) {
  const { db } = useStore()
  const [seg, setSeg] = useState<Segmento>(segmento ?? 'vacanze')
  const [clienteId, setClienteId] = useState('')
  const [titolo, setTitolo] = useState('')
  const [destinazione, setDestinazione] = useState('')
  const [partenza, setPartenza] = useState(dayOffset(60))
  const [rientro, setRientro] = useState(dayOffset(67))
  const [extraUE, setExtraUE] = useState(false)
  const [operatoreId, setOperatoreId] = useState(db.operatori[0].id)
  const [nuovo, setNuovo] = useState(false)
  const [cNome, setCNome] = useState('')
  const [cTel, setCTel] = useState('')
  const [cEmail, setCEmail] = useState('')
  const clienti = db.clienti.filter((c) => c.segmento === seg)
  const valido = (nuovo ? cNome.trim() && cTel.trim() : clienteId) && titolo.trim() && destinazione.trim() && partenza && rientro >= partenza

  const crea = () => {
    const anno = new Date().getFullYear()
    const prossimo = db.pratiche.reduce((m, p) => Math.max(m, parseInt(p.codice.split('/')[1], 10) || 0), 0) + 3
    const cliente: Cliente | undefined = nuovo
      ? { id: uid('c'), nome: cNome.trim(), segmento: seg, saluto: cNome.trim().split(' ')[0], tel: cTel.trim(), email: cEmail.trim(), citta: '', interessi: [], marketing: false }
      : undefined
    onCreate(
      {
        id: uid('pr'), codice: `${anno}/${String(prossimo).padStart(4, '0')}`,
        clienteId: cliente?.id ?? clienteId, operatoreId, titolo: titolo.trim(), destinazione: destinazione.trim(), extraUE,
        stato: 'preventivo', partenza, rientro, creata: dayOffset(0), validitaPreventivo: dayOffset(7),
        passeggeri: [], servizi: [], pagamenti: [],
      },
      cliente
    )
  }

  return (
    <Modal open onClose={onClose} title="Nuovo preventivo" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-brand" disabled={!valido} onClick={crea}>Crea preventivo</button></>}>
      <div className="space-y-3">
        {!segmento && (
          <div className="grid grid-cols-2 gap-2">
            {(['vacanze', 'business'] as Segmento[]).map((s) => (
              <button key={s} type="button" onClick={() => { setSeg(s); setClienteId('') }} className={cx('rounded-lg border px-3 py-2.5 text-left text-sm transition', seg === s ? 'border-brand bg-brand-soft font-semibold text-brand-dark' : 'border-line-strong bg-white text-ink-soft')}>
                {s === 'vacanze' ? 'Per vacanze' : 'Per professionisti'}
                <span className="block text-[11px] font-normal text-ink-mute">{s === 'vacanze' ? 'Famiglie, coppie, gruppi' : 'Manager, sportivi, aziende'}</span>
              </button>
            ))}
          </div>
        )}

        {nuovo ? (
          <div className="space-y-3 rounded-lg border border-line-strong bg-canvas/50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Nuovo cliente ({NOME_SEGMENTO[seg].toLowerCase()})</p>
              <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => setNuovo(false)}>Scegli uno esistente</button>
            </div>
            <Field label="Nome e cognome (o ragione sociale)"><input className="input" value={cNome} onChange={(e) => setCNome(e.target.value)} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefono"><input type="tel" className="input" value={cTel} onChange={(e) => setCTel(e.target.value)} /></Field>
              <Field label="Email (serve per inviare il preventivo)"><input type="email" className="input" value={cEmail} onChange={(e) => setCEmail(e.target.value)} /></Field>
            </div>
            <p className="text-[11px] text-ink-mute">Gli altri dati (città, interessi, carte, consenso email) si completano dopo, dalla scheda del cliente.</p>
          </div>
        ) : (
          <Field label="Cliente">
            <div className="flex gap-2">
              <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleziona…</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button type="button" className="btn-ghost shrink-0" onClick={() => setNuovo(true)}>+ Nuovo</button>
            </div>
          </Field>
        )}

        <Field label="Titolo del viaggio"><input className="input" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. Crociera nel Mediterraneo" /></Field>
        <Field label="Destinazione"><input className="input" value={destinazione} onChange={(e) => setDestinazione(e.target.value)} placeholder="Es. Grecia" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Partenza"><input type="date" className="input" value={partenza} onChange={(e) => setPartenza(e.target.value)} /></Field>
          <Field label="Rientro"><input type="date" className="input" value={rientro} min={partenza} onChange={(e) => setRientro(e.target.value)} /></Field>
        </div>
        <Field label="Operatore">
          <select className="input" value={operatoreId} onChange={(e) => setOperatoreId(e.target.value)}>{db.operatori.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={extraUE} onChange={(e) => setExtraUE(e.target.checked)} /> Destinazione extra UE (controlli passaporto)</label>
        <p className="text-xs text-ink-mute">Il preventivo vale 7 giorni e compare subito nelle <strong>pratiche {seg === 'vacanze' ? 'vacanze' : 'professionisti'}</strong>: lì aggiungi servizi e passeggeri, lo invii al cliente e lo chiudi come affare.</p>
      </div>
    </Modal>
  )
}
