import { ArrowRight, CircleCheck, Mail, MailCheck, Plus, Send, TimerReset } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmailPreventivoModal } from '../components/preventivi'
import { NuovaPratica } from '../components/NuovaPratica'
import { clienteDi } from '../components/shared'
import { Badge, Card, Empty, PageHeader, Segmented, Stat } from '../components/ui'
import type { Pratica, Segmento } from '../data/types'
import { totRicavo } from '../lib/calc'
import { statoInvio, ultimoInvio } from '../lib/preventivi'
import { segmentoPratica } from '../lib/segmenti'
import { cx, daysFromToday, eur0, fmtDate, relDays } from '../lib/format'
import { useStore } from '../store'

type Vista = 'aperti' | 'chiusi' | 'persi'

export default function Preventivi() {
  const { db, update, updatePratica } = useStore()
  const nav = useNavigate()
  const [vista, setVista] = useState<Vista>('aperti')
  const [seg, setSeg] = useState<Segmento | 'tutti'>('tutti')
  const [nuovo, setNuovo] = useState(false)
  const [invia, setInvia] = useState<Pratica | null>(null)

  const tutti = useMemo(() => db.pratiche.filter((p) => p.stato === 'preventivo' || p.chiusaIl || p.persoIl), [db])
  const aperti = tutti.filter((p) => p.stato === 'preventivo')
  const chiusi = tutti.filter((p) => p.chiusaIl && p.stato !== 'preventivo')
  const persi = tutti.filter((p) => p.persoIl)

  const lista = (vista === 'aperti' ? aperti : vista === 'chiusi' ? chiusi : persi)
    .filter((p) => seg === 'tutti' || segmentoPratica(db, p) === seg)
    .sort((a, b) => (a.validitaPreventivo ?? a.chiusaIl ?? a.persoIl ?? '').localeCompare(b.validitaPreventivo ?? b.chiusaIl ?? b.persoIl ?? ''))

  const daInviare = aperti.filter((p) => statoInvio(p) === 'da_inviare').length
  const inAttesa = aperti.filter((p) => statoInvio(p) === 'inviato').length
  const inScadenza = aperti.filter((p) => p.validitaPreventivo && daysFromToday(p.validitaPreventivo) <= 3).length
  const decisi = chiusi.length + persi.length
  const tasso = decisi ? Math.round((chiusi.length / decisi) * 100) : null

  return (
    <>
      <PageHeader
        title="Preventivi"
        subtitle="Prepara l’offerta, mandala al cliente per email e, se accetta, completa la pratica e chiudi l’affare."
        actions={<button className="btn-brand" onClick={() => setNuovo(true)}><Plus size={16} /> Nuovo preventivo</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valore aperto" value={eur0(aperti.reduce((s, p) => s + totRicavo(p), 0))} hint={`${aperti.length} preventivi aperti`} tone="brand" icon={<Mail size={16} />} />
        <Stat label="Da inviare" value={daInviare} hint="ancora non spediti al cliente" tone={daInviare ? 'amber' : 'green'} icon={<Send size={16} />} />
        <Stat label="In attesa di risposta" value={inAttesa} hint={inScadenza ? `${inScadenza} in scadenza entro 3 giorni` : 'nessuno in scadenza'} tone="blue" icon={<TimerReset size={16} />} />
        <Stat label="Affari chiusi" value={tasso === null ? '—' : `${tasso}%`} hint={`${chiusi.length} chiusi, ${persi.length} persi`} tone="green" icon={<CircleCheck size={16} />} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented options={[{ id: 'aperti', label: `Aperti (${aperti.length})` }, { id: 'chiusi', label: `Affari chiusi (${chiusi.length})` }, { id: 'persi', label: `Persi (${persi.length})` }]} value={vista} onChange={setVista} />
        <Segmented options={[{ id: 'tutti', label: 'Tutti' }, { id: 'vacanze', label: 'Vacanze' }, { id: 'business', label: 'Professionisti' }]} value={seg} onChange={setSeg} />
      </div>

      {lista.length === 0 ? <Empty>{vista === 'aperti' ? 'Nessun preventivo aperto. Creane uno con “Nuovo preventivo”.' : 'Nessun preventivo in questo elenco.'}</Empty> : (
        <div className="space-y-3">
          {lista.map((p) => {
            const cli = clienteDi(db, p)
            const business = segmentoPratica(db, p) === 'business'
            const ult = ultimoInvio(p)
            const st = p.stato === 'preventivo' ? statoInvio(p) : null
            const gg = p.validitaPreventivo ? daysFromToday(p.validitaPreventivo) : null
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={business ? 'blue' : 'brand'}>{business ? 'Professionista' : 'Vacanze'}</Badge>
                      {st === 'da_inviare' && <Badge tone="amber">da inviare</Badge>}
                      {st === 'inviato' && <Badge tone="blue"><MailCheck size={11} /> inviato</Badge>}
                      {st === 'scaduto' && <Badge tone="red">scaduto</Badge>}
                      {vista === 'chiusi' && <Badge tone="green"><CircleCheck size={11} /> affare chiuso il {fmtDate(p.chiusaIl)}</Badge>}
                      {vista === 'persi' && <Badge tone="red">perso il {fmtDate(p.persoIl)}</Badge>}
                    </div>
                    <Link to={`/pratiche/${p.id}`} className="text-[15px] font-semibold hover:text-brand">{p.titolo}</Link>
                    <p className="text-xs text-ink-mute">{cli?.nome} · {p.codice} · partenza {fmtDate(p.partenza)}</p>
                    {vista === 'persi' && p.motivoPersa && <p className="mt-1 text-xs text-ink-soft">Motivo: {p.motivoPersa}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">{eur0(totRicavo(p))}</p>
                    {vista === 'aperti' && gg !== null && <p className={cx('text-xs', gg <= 3 ? 'font-medium text-rose2' : 'text-ink-mute')}>{gg < 0 ? `scaduto ${relDays(p.validitaPreventivo!)}` : `valido fino al ${fmtDate(p.validitaPreventivo)} (${relDays(p.validitaPreventivo!)})`}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <p className="text-xs text-ink-soft">
                    {ult ? <>Inviato il {fmtDate(ult.data)} a <strong>{ult.a}</strong>{p.invii && p.invii.length > 1 ? ` (${p.invii.length} invii)` : ''}</> : p.servizi.length === 0 ? 'Nessun servizio ancora: aggiungili nella pratica prima di inviare.' : 'Non ancora inviato.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {vista === 'aperti' && <button className="btn-ghost btn-sm" onClick={() => setInvia(p)}><Send size={13} /> {ult ? 'Invia di nuovo' : 'Invia email'}</button>}
                    <Link to={`/pratiche/${p.id}`} className="btn-ghost btn-sm">{vista === 'aperti' ? 'Completa pratica' : 'Apri pratica'} <ArrowRight size={13} /></Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {nuovo && (
        <NuovaPratica
          onClose={() => setNuovo(false)}
          onCreate={(p, nuovoCliente) => {
            update((d) => ({ ...d, clienti: nuovoCliente ? [nuovoCliente, ...d.clienti] : d.clienti, pratiche: [p, ...d.pratiche] }))
            setNuovo(false)
            nav(`/pratiche/${p.id}`)
          }}
        />
      )}
      {invia && <EmailPreventivoModal key={invia.id} p={invia} onClose={() => setInvia(null)} onSent={(iv) => { updatePratica(invia.id, (x) => ({ ...x, invii: [...(x.invii ?? []), iv] })); setInvia(null) }} />}
    </>
  )
}
