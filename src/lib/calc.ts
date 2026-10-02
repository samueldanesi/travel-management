import type { DB, Pratica, Servizio, StatoPratica, TipoServizio } from '../data/types'
import { daysFromToday, iso, parse, TODAY } from './format'

export const IVA = 0.22

export const STATO_LABEL: Record<StatoPratica, string> = {
  preventivo: 'Preventivo',
  confermata: 'Confermata',
  saldata: 'Saldata',
  in_viaggio: 'In viaggio',
  conclusa: 'Conclusa',
  annullata: 'Annullata',
}
export const STATO_TONE: Record<StatoPratica, 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'brand' | 'dark'> = {
  preventivo: 'amber',
  confermata: 'blue',
  saldata: 'green',
  in_viaggio: 'brand',
  conclusa: 'neutral',
  annullata: 'red',
}
export const TIPO_LABEL: Record<TipoServizio, string> = {
  volo: 'Volo',
  hotel: 'Hotel',
  crociera: 'Crociera',
  pacchetto: 'Pacchetto',
  transfer: 'Transfer',
  assicurazione: 'Assicurazione',
  visto: 'Visto',
  noleggio: 'Noleggio auto',
  escursione: 'Escursione',
}

export const totRicavo = (p: Pratica) => p.servizi.reduce((s, x) => s + x.ricavo, 0)
export const totCosto = (p: Pratica) => p.servizi.reduce((s, x) => s + x.costo, 0)
export const margine = (p: Pratica) => totRicavo(p) - totCosto(p)
export const marginePerc = (p: Pratica) => (totRicavo(p) ? (margine(p) / totRicavo(p)) * 100 : 0)

/** IVA stimata: sul margine (scorporata) per il 74ter, sulla commissione per l'intermediazione. Indicativa. */
export const ivaServizio = (s: Servizio) => {
  const m = s.ricavo - s.costo
  return s.regime === '74ter' ? (m * IVA) / (1 + IVA) : m * IVA
}
export const ivaPratica = (p: Pratica) => p.servizi.reduce((s, x) => s + ivaServizio(x), 0)

export const incassato = (p: Pratica) => p.pagamenti.filter((x) => x.incassatoIl).reduce((s, x) => s + x.importo, 0)
export const pianificato = (p: Pratica) => p.pagamenti.reduce((s, x) => s + x.importo, 0)
export const daIncassare = (p: Pratica) => totRicavo(p) - incassato(p)
export const scopertoPiano = (p: Pratica) => totRicavo(p) - pianificato(p)
export const pagamentiScaduti = (p: Pratica) => p.pagamenti.filter((x) => !x.incassatoIl && daysFromToday(x.scadenza) < 0)
export const daPagareFornitori = (p: Pratica) => p.servizi.filter((s) => !s.pagatoFornitore).reduce((s, x) => s + x.costo, 0)

export const attiva = (p: Pratica) => p.stato !== 'annullata' && p.stato !== 'conclusa'

/** Il passaporto deve valere almeno 6 mesi dopo il rientro per molte destinazioni extra UE. */
export function problemiDocumenti(p: Pratica) {
  const out: { chi: string; testo: string; grave: boolean }[] = []
  const limite = parse(p.rientro)
  limite.setMonth(limite.getMonth() + (p.extraUE ? 6 : 0))
  for (const x of p.passeggeri) {
    const nome = `${x.nome} ${x.cognome}`
    if (!x.docNumero) { out.push({ chi: nome, testo: 'documento mancante', grave: true }); continue }
    const sc = parse(x.docScadenza)
    if (sc < parse(p.rientro)) out.push({ chi: nome, testo: 'documento scaduto prima del rientro', grave: true })
    else if (p.extraUE && x.docTipo !== 'passaporto') out.push({ chi: nome, testo: 'per questa destinazione serve il passaporto', grave: true })
    else if (sc < limite) out.push({ chi: nome, testo: 'il passaporto vale meno di 6 mesi dopo il rientro', grave: false })
  }
  return out
}

export type TipoScadenza = 'incasso' | 'fornitore' | 'emissione' | 'documenti' | 'partenza'
export interface Scadenza {
  id: string
  tipo: TipoScadenza
  data: string
  titolo: string
  dettaglio: string
  praticaId: string
  importo?: number
}

export const SCAD_LABEL: Record<TipoScadenza, string> = {
  incasso: 'Incasso cliente',
  fornitore: 'Pagamento fornitore',
  emissione: 'Emissione / opzione',
  documenti: 'Documenti',
  partenza: 'Partenza',
}

export function scadenze(db: DB): Scadenza[] {
  const out: Scadenza[] = []
  const forn = (id: string) => db.fornitori.find((f) => f.id === id)?.nome ?? '—'
  for (const p of db.pratiche) {
    if (p.stato === 'annullata') continue
    const cli = db.clienti.find((c) => c.id === p.clienteId)?.nome ?? ''
    if (p.stato !== 'preventivo' && p.stato !== 'conclusa') {
      for (const x of p.pagamenti) if (!x.incassatoIl) out.push({ id: `i${x.id}`, tipo: 'incasso', data: x.scadenza, titolo: `${x.etichetta} — ${cli}`, dettaglio: p.titolo, praticaId: p.id, importo: x.importo })
      for (const s of p.servizi) {
        if (!s.pagatoFornitore && s.scadenzaFornitore) out.push({ id: `f${s.id}`, tipo: 'fornitore', data: s.scadenzaFornitore, titolo: `Pagare ${forn(s.fornitoreId)}`, dettaglio: `${s.descrizione} · ${p.codice}`, praticaId: p.id, importo: s.costo })
      }
    }
    if (p.stato !== 'conclusa') {
      for (const s of p.servizi) if (s.stato !== 'emesso' && s.scadenzaEmissione) out.push({ id: `e${s.id}`, tipo: 'emissione', data: s.scadenzaEmissione, titolo: s.stato === 'opzione' ? `Opzione in scadenza: ${s.descrizione}` : `Emettere: ${s.descrizione}`, dettaglio: `${cli} · ${p.codice}`, praticaId: p.id })
      const pr = problemiDocumenti(p)
      if (pr.length && p.stato !== 'preventivo') out.push({ id: `d${p.id}`, tipo: 'documenti', data: iso(TODAY), titolo: `Documenti da verificare (${pr.length})`, dettaglio: `${pr[0].chi}: ${pr[0].testo} · ${p.codice}`, praticaId: p.id })
      if (p.stato !== 'in_viaggio') out.push({ id: `p${p.id}`, tipo: 'partenza', data: p.partenza, titolo: `Partenza ${p.destinazione}`, dettaglio: `${cli} · ${p.passeggeri.length} pax`, praticaId: p.id })
    }
  }
  return out.sort((a, b) => a.data.localeCompare(b.data))
}

export const STATO_ORDER: StatoPratica[] = ['preventivo', 'confermata', 'saldata', 'in_viaggio', 'conclusa', 'annullata']
