import { ExternalLink, Info, Send } from 'lucide-react'
import { useState } from 'react'
import type { InvioPreventivo, Pratica } from '../data/types'
import { bozzaEmail, MOTIVI_PERSA } from '../lib/preventivi'
import { dayOffset, uid } from '../lib/format'
import { useStore } from '../store'
import { Field, Modal } from './ui'

export function EmailPreventivoModal({ p, onClose, onSent }: { p: Pratica; onClose: () => void; onSent: (invio: InvioPreventivo) => void }) {
  const { db } = useStore()
  const bozza = bozzaEmail(db, p)
  const [a, setA] = useState(bozza.a)
  const [cc, setCc] = useState('')
  const [oggetto, setOggetto] = useState(bozza.oggetto)
  const [testo, setTesto] = useState(bozza.testo)
  const emailOk = /^\S+@\S+\.\S+$/.test(a.trim())
  const ok = emailOk && oggetto.trim() && testo.trim()
  const mailto = `mailto:${encodeURIComponent(a.trim())}?${cc.trim() ? `cc=${encodeURIComponent(cc.trim())}&` : ''}subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Invia il preventivo per email"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Annulla</button>
          <a className={`btn-ghost ${ok ? '' : 'pointer-events-none opacity-50'}`} href={mailto}><ExternalLink size={14} /> Apri nel programma di posta</a>
          <button className="btn-brand" disabled={!ok} onClick={() => onSent({ id: uid('iv'), data: dayOffset(0), a: a.trim(), cc: cc.trim() || undefined, oggetto: oggetto.trim(), testo })}><Send size={14} /> Invia</button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg bg-sky2-soft px-3 py-2 text-xs text-sky2">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>Versione dimostrativa: l’email non parte davvero ma viene registrata nella pratica, con data e testo. Nel gestionale vero si collega un servizio di invio. Per inviarla subito puoi usare “Apri nel programma di posta”.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="A" hint={!a.trim() ? 'Il cliente non ha un’email: inseriscila qui.' : a.trim() && !emailOk ? 'Indirizzo non valido.' : undefined}><input type="email" className="input" value={a} onChange={(e) => setA(e.target.value)} /></Field>
          <Field label="Copia a (facoltativo)"><input type="email" className="input" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Es. assistente o collega" /></Field>
        </div>
        <Field label="Oggetto"><input className="input" value={oggetto} onChange={(e) => setOggetto(e.target.value)} /></Field>
        <Field label="Messaggio"><textarea className="input min-h-72 text-[13.5px] leading-relaxed" value={testo} onChange={(e) => setTesto(e.target.value)} /></Field>
        <p className="text-[11px] text-ink-mute">Il testo si genera dai servizi e dal prezzo della pratica. Se li modifichi, riapri questa finestra per aggiornarlo.</p>
      </div>
    </Modal>
  )
}

export function AffarePersoModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState(MOTIVI_PERSA[0])
  return (
    <Modal open onClose={onClose} title="Affare perso" footer={<><button className="btn-ghost" onClick={onClose}>Annulla</button><button className="btn-primary" onClick={() => onConfirm(motivo)}>Segna come perso</button></>}>
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Il preventivo resta nello storico ma esce dalle pratiche aperte. Il motivo ti aiuta a capire dove si perdono le vendite.</p>
        <Field label="Perché non si è concluso?">
          <select className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVI_PERSA.map((m) => <option key={m}>{m}</option>)}</select>
        </Field>
      </div>
    </Modal>
  )
}
