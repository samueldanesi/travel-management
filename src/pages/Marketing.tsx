import { CalendarDays, Info, MailCheck, MailX, MousePointerClick, Plus, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, Field, Modal, PageHeader, Stat, Tabs } from '../components/ui'
import type { Campagna, TemplateId } from '../data/types'
import { CALENDARIO, TEMPLATES, templateDi } from '../lib/marketing'
import { INTERESSI, destinatari } from '../lib/segmenti'
import { cx, daysFromToday, dayOffset, fmtDate, num, relDays, uid } from '../lib/format'
import { useStore } from '../store'

type Tab = 'campagne' | 'automazioni' | 'calendario'
const STATO_TONE = { bozza: 'neutral', programmata: 'amber', inviata: 'green' } as const

export default function Marketing() {
  const { db, update } = useStore()
  const [tab, setTab] = useState<Tab>('campagne')
  const [editor, setEditor] = useState<{ campagna: Campagna } | null>(null)

  const inviate = db.campagne.filter((c) => c.stato === 'inviata')
  const conStat = inviate.filter((c) => c.aperture !== undefined && c.inviati)
  const totInv = conStat.reduce((s, c) => s + (c.inviati ?? 0), 0)
  const aperturaMedia = totInv ? (conStat.reduce((s, c) => s + (c.aperture ?? 0), 0) / totInv) * 100 : 0
  const clickMedio = totInv ? (conStat.reduce((s, c) => s + (c.click ?? 0), 0) / totInv) * 100 : 0
  const raggiungibili = destinatari(db.clienti)

  const nuova = (template: TemplateId = 'libero', data?: string): Campagna => {
    const t = templateDi(template)
    return { id: uid('cm'), nome: t.id === 'libero' ? '' : t.label, template: t.id, oggetto: t.oggetto, testo: t.testo, stato: 'bozza', data }
  }
  const salva = (c: Campagna) => {
    update((d) => ({ ...d, campagne: d.campagne.some((x) => x.id === c.id) ? d.campagne.map((x) => (x.id === c.id ? c : x)) : [c, ...d.campagne] }))
    setEditor(null)
  }
  const ordinate = [...db.campagne].sort((a, b) => {
    const ord = { programmata: 0, bozza: 1, inviata: 2 } as const
    return ord[a.stato] - ord[b.stato] || (b.data ?? '').localeCompare(a.data ?? '')
  })

  return (
    <>
      <PageHeader
        title="Email marketing"
        subtitle="Newsletter e offerte ai clienti vacanze, al momento giusto: Natale, Capodanno, early booking, ponti."
        actions={<button className="btn-brand" onClick={() => setEditor({ campagna: nuova() })}><Plus size={16} /> Nuova campagna</button>}
      />
      <div className="mb-5 flex items-start gap-2 rounded-lg bg-sky2-soft px-3 py-2.5 text-xs text-sky2">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>Versione dimostrativa: nessuna email viene realmente inviata. Nel gestionale vero si collega un servizio di invio (per esempio Brevo, Resend o Mailchimp) e la schermata resta questa.</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Contatti raggiungibili" value={raggiungibili.ok.length} hint={`${raggiungibili.esclusi} esclusi: senza consenso o email`} tone="brand" icon={<MailCheck size={16} />} />
        <Stat label="Campagne inviate" value={inviate.length} hint={`${db.campagne.filter((c) => c.stato === 'programmata').length} programmate`} tone="blue" icon={<Send size={16} />} />
        <Stat label="Aperture medie" value={`${num(aperturaMedia)}%`} hint="sulle campagne inviate" tone="green" icon={<MailCheck size={16} />} />
        <Stat label="Click medi" value={`${num(clickMedio)}%`} hint="sui link nelle email" tone="amber" icon={<MousePointerClick size={16} />} />
      </div>

      <Tabs<Tab>
        tabs={[
          { id: 'campagne', label: 'Campagne', badge: <Badge>{db.campagne.length}</Badge> },
          { id: 'automazioni', label: 'Automazioni', badge: <Badge tone="green">{db.automazioni.filter((a) => a.attiva).length} attive</Badge> },
          { id: 'calendario', label: 'Calendario stagionale' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="pt-5">
        {tab === 'campagne' && (
          <div className="space-y-3">
            {ordinate.map((c) => {
              const d = destinatari(db.clienti, c.interesse)
              const inv = c.inviati ?? d.ok.length
              return (
                <button key={c.id} onClick={() => setEditor({ campagna: c })} className="card block w-full p-4 text-left transition hover:border-line-strong active:bg-canvas">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">{c.nome}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="brand">{c.interesse ? `Clienti vacanze · ${c.interesse}` : 'Clienti vacanze'}</Badge>
                        <Badge tone="neutral">{templateDi(c.template).label}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge tone={STATO_TONE[c.stato]}>{c.stato}</Badge>
                      {c.data && <p className="mt-1 text-xs text-ink-mute">{fmtDate(c.data)}{c.stato === 'programmata' && ` · ${relDays(c.data)}`}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-xs text-ink-soft">
                    <span>{c.stato === 'inviata' ? 'Inviata a' : 'Destinatari'}: <strong className="text-ink">{inv}</strong></span>
                    {c.stato === 'inviata' && c.aperture !== undefined && c.inviati ? (
                      <>
                        <span>Aperta da <strong className="text-ink">{num((c.aperture / c.inviati) * 100)}%</strong></span>
                        <span>Click <strong className="text-ink">{num(((c.click ?? 0) / c.inviati) * 100)}%</strong></span>
                      </>
                    ) : c.stato === 'inviata' ? <span className="text-ink-mute">statistiche non disponibili in demo</span> : d.esclusi > 0 && <span className="text-ink-mute">{d.esclusi} esclusi (senza consenso)</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {tab === 'automazioni' && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Email che partono da sole in base a quello che succede: nessuno deve ricordarsi di scriverle.</p>
            {db.automazioni.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{a.nome}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{a.descrizione}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge tone="blue">{a.quando}</Badge>
                      {a.attiva && <span className="text-ink-mute">{a.inviati30} inviate negli ultimi 30 giorni</span>}
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={a.attiva}
                    aria-label={`Attiva ${a.nome}`}
                    onClick={() => update((d) => ({ ...d, automazioni: d.automazioni.map((x) => (x.id === a.id ? { ...x, attiva: !x.attiva } : x)) }))}
                    className={cx('relative h-7 w-12 shrink-0 rounded-full transition', a.attiva ? 'bg-moss' : 'bg-line-strong')}
                  >
                    <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', a.attiva ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'calendario' && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">I momenti dell’anno in cui conviene scrivere ai clienti. Con un clic prepari la campagna già pronta.</p>
            {CALENDARIO.filter((x) => daysFromToday(x.invio) >= -7).map((x) => {
              const gia = db.campagne.some((c) => c.template === x.template && c.data === x.invio)
              return (
                <Card key={x.titolo}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><CalendarDays size={18} /></span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold">{x.titolo}</p>
                        <p className="text-sm text-ink-soft">{x.nota}</p>
                        <p className="mt-1 text-xs text-ink-mute">Invio consigliato: <strong>{fmtDate(x.invio)}</strong> ({relDays(x.invio)})</p>
                      </div>
                    </div>
                    {gia ? <Badge tone="green">già pianificata</Badge> : <button className="btn-ghost btn-sm" onClick={() => { setTab('campagne'); setEditor({ campagna: { ...nuova(x.template, x.invio), nome: x.titolo } }) }}><Plus size={13} /> Crea campagna</button>}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {editor && <Editor key={editor.campagna.id} campagna={editor.campagna} esiste={db.campagne.some((c) => c.id === editor.campagna.id)} onClose={() => setEditor(null)} onSave={salva} onDelete={(id) => { update((d) => ({ ...d, campagne: d.campagne.filter((c) => c.id !== id) })); setEditor(null) }} />}
    </>
  )
}

function Editor({ campagna, esiste, onClose, onSave, onDelete }: { campagna: Campagna; esiste: boolean; onClose: () => void; onSave: (c: Campagna) => void; onDelete: (id: string) => void }) {
  const { db } = useStore()
  const sola = campagna.stato === 'inviata'
  const t0 = templateDi(campagna.template)
  const [nome, setNome] = useState(campagna.nome)
  const [template, setTemplate] = useState<TemplateId>(campagna.template)
  const [interesse, setInteresse] = useState(campagna.interesse ?? '')
  const [oggetto, setOggetto] = useState(campagna.oggetto || t0.oggetto)
  const [testo, setTesto] = useState(campagna.testo || t0.testo)
  const [data, setData] = useState(campagna.data ?? dayOffset(14))

  const d = useMemo(() => destinatari(db.clienti, interesse || undefined), [db.clienti, interesse])
  const esempio = d.ok[0]?.saluto ?? 'famiglia Rossi'
  const completa = nome.trim() && oggetto.trim() && testo.trim() && d.ok.length > 0
  const cambia = (id: TemplateId) => {
    const t = templateDi(id)
    setTemplate(id); setOggetto(t.oggetto); setTesto(t.testo)
    if (!nome.trim() || TEMPLATES.some((x) => x.label === nome)) setNome(t.id === 'libero' ? '' : t.label)
  }
  const base = (): Campagna => ({ ...campagna, nome: nome.trim(), template, interesse: interesse || undefined, oggetto, testo })

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={sola ? 'Campagna inviata' : esiste ? 'Modifica campagna' : 'Nuova campagna'}
      footer={
        sola ? <button className="btn-ghost" onClick={onClose}>Chiudi</button> : (
          <>
            {esiste && <button className="btn-ghost mr-auto text-rose2" onClick={() => { if (confirm('Eliminare questa campagna?')) onDelete(campagna.id) }}>Elimina</button>}
            <button className="btn-ghost" onClick={() => onSave({ ...base(), stato: 'bozza', data: undefined })} disabled={!nome.trim()}>Salva bozza</button>
            <button className="btn-ghost" disabled={!completa || daysFromToday(data) < 0} onClick={() => onSave({ ...base(), stato: 'programmata', data })}>Programma</button>
            <button className="btn-brand" disabled={!completa} onClick={() => { if (confirm(`Inviare ora a ${d.ok.length} destinatari? (Demo: nessuna email parte davvero)`)) onSave({ ...base(), stato: 'inviata', data: dayOffset(0), inviati: d.ok.length, aperture: undefined, click: undefined }) }}><Send size={14} /> Invia ora</button>
          </>
        )
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Nome interno"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} disabled={sola} placeholder="Es. Offerte Natale 2026" /></Field>
          <Field label="Modello di partenza">
            <select className="input" value={template} onChange={(e) => cambia(e.target.value as TemplateId)} disabled={sola}>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          </Field>
          <Field label="Interesse dei clienti vacanze" hint="Scrivi solo a chi ama un certo tipo di viaggio, oppure a tutti i clienti vacanze.">
            <select className="input" value={interesse} onChange={(e) => setInteresse(e.target.value)} disabled={sola}>
              <option value="">Tutti i clienti vacanze</option>
              {INTERESSI.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <div className={cx('rounded-lg px-3 py-2 text-xs', d.ok.length ? 'bg-moss-soft text-moss' : 'bg-rose2-soft text-rose2')}>
            {sola ? <>Inviata a <strong>{campagna.inviati}</strong> destinatari.</> : d.ok.length ? <>Arriverà a <strong>{d.ok.length}</strong> clienti{d.esclusi > 0 && <> · <MailX size={11} className="inline" /> {d.esclusi} esclusi perché senza consenso o senza email</>}</> : 'Nessun destinatario con consenso per questo filtro.'}
          </div>
          <Field label="Oggetto"><input className="input" value={oggetto} onChange={(e) => setOggetto(e.target.value)} disabled={sola} /></Field>
          <Field label="Testo" hint="{saluto} diventa “famiglia Rossi”, “dott. Ferretti”, ecc. per ogni cliente."><textarea className="input min-h-48" value={testo} onChange={(e) => setTesto(e.target.value)} disabled={sola} /></Field>
          {!sola && <Field label="Data di invio (se programmi)"><input type="date" className="input" value={data} min={dayOffset(0)} onChange={(e) => setData(e.target.value)} /></Field>}
        </div>

        <div>
          <p className="label">Anteprima</p>
          <div className="overflow-hidden rounded-xl border border-line-strong bg-canvas">
            <div className="border-b border-line bg-white px-4 py-2.5 text-xs text-ink-mute">
              <div>Da: <span className="text-ink">Castruccio Viaggi</span></div>
              <div className="truncate">Oggetto: <span className="font-semibold text-ink">{oggetto || '—'}</span></div>
            </div>
            <div className="bg-brand px-5 py-4 text-white"><span className="display text-lg font-semibold">Castruccio Viaggi</span></div>
            <div className="whitespace-pre-wrap bg-white px-5 py-5 text-[13.5px] leading-relaxed text-ink">{(testo || '').split('{saluto}').join(esempio) || 'Scrivi il testo dell’email…'}</div>
            <div className="border-t border-line bg-canvas px-5 py-3 text-[11px] leading-snug text-ink-mute">
              Ricevi questa email perché hai dato il consenso a ricevere le nostre comunicazioni. <span className="underline">Annulla l’iscrizione</span> in qualsiasi momento.
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-mute">Esempio con il destinatario: {esempio}.</p>
        </div>
      </div>
    </Modal>
  )
}
