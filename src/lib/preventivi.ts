import type { DB, Pratica } from '../data/types'
import { totRicavo } from './calc'
import { daysFromToday, eur, fmtDate } from './format'

export const MOTIVI_PERSA = ['Prezzo troppo alto', 'Ha scelto un altro operatore', 'Ha rinunciato al viaggio', 'Nessuna risposta', 'Altro']

export const ultimoInvio = (p: Pratica) => (p.invii && p.invii.length ? [...p.invii].sort((a, b) => b.data.localeCompare(a.data))[0] : undefined)

/** Stato commerciale di un preventivo aperto */
export function statoInvio(p: Pratica): 'da_inviare' | 'inviato' | 'scaduto' {
  if (p.validitaPreventivo && daysFromToday(p.validitaPreventivo) < 0) return 'scaduto'
  return ultimoInvio(p) ? 'inviato' : 'da_inviare'
}

/** Oggetto e testo dell'email, già pronti: il tono cambia tra clienti vacanze e professionisti */
export function bozzaEmail(db: DB, p: Pratica): { a: string; oggetto: string; testo: string } {
  const cli = db.clienti.find((c) => c.id === p.clienteId)
  const op = db.operatori.find((o) => o.id === p.operatoreId)
  const business = cli?.segmento === 'business'
  const voci = p.servizi.length
    ? p.servizi.map((s) => `  • ${s.descrizione}: ${eur(s.ricavo)}`).join('\n')
    : '  • Servizi in definizione'
  const pax = p.passeggeri.length ? `, per ${p.passeggeri.length} ${p.passeggeri.length === 1 ? 'persona' : 'persone'}` : ''
  const validita = p.validitaPreventivo ? `Il preventivo è valido fino al ${fmtDate(p.validitaPreventivo)}: dopo questa data i prezzi dei fornitori potrebbero cambiare.` : ''
  const firma = `${op?.nome ?? 'Castruccio Viaggi'}\nCastruccio Viaggi`
  const periodo = `${fmtDate(p.partenza)} – ${fmtDate(p.rientro)}`

  const testo = business
    ? `Gentile ${cli?.saluto ?? 'cliente'},\n\nin allegato a questa email trovate la proposta per “${p.titolo}” (${p.destinazione}, ${periodo}${pax}).\n\nLa proposta comprende:\n${voci}\n\nTotale: ${eur(totRicavo(p))}\n\n${validita}\n\nLe tariffe scelte possono essere modificate o cancellate secondo le condizioni indicate dal fornitore: se vi interessa una soluzione più flessibile, ve ne proponiamo volentieri un’altra. Per procedere basta una risposta a questa email.\n\nCordiali saluti,\n${firma}`
    : `Ciao ${cli?.saluto ?? ''},\n\ncome promesso ti invio il preventivo per “${p.titolo}” (${p.destinazione}, ${periodo}${pax}).\n\nCosa include:\n${voci}\n\nTotale: ${eur(totRicavo(p))}\n\n${validita}\n\nSe ti piace, basta rispondere a questa email o passare in agenzia: ti spiego come funzionano acconto e saldo. Se vuoi cambiare qualcosa (date, hotel, durata) lo sistemiamo insieme.\n\nUn caro saluto,\n${firma}`

  return { a: cli?.email ?? '', oggetto: business ? `La vostra proposta: ${p.titolo}` : `Il tuo preventivo: ${p.titolo}`, testo: testo.replace(/\n{3,}/g, '\n\n') }
}
