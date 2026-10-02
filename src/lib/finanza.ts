import type { Carta, Circuito, DB, Pratica } from '../data/types'
import { iso, parse, TODAY } from './format'
import { margine, totRicavo } from './calc'

export interface PuntoMese {
  anno: number
  mese: number // 1-12
  fatturato: number
  margine: number
}

export const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
export const MESI_LUNGHI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

/** Pratiche che contano come venduto */
export const venduta = (p: Pratica) => p.stato === 'confermata' || p.stato === 'saldata' || p.stato === 'in_viaggio' || p.stato === 'conclusa'

/** Serie mensile: storico importato + pratiche create dopo l'ultima data coperta dallo storico. */
export function serie(db: DB): PuntoMese[] {
  const m = new Map<string, PuntoMese>()
  const get = (anno: number, mese: number) => {
    const k = `${anno}-${mese}`
    if (!m.has(k)) m.set(k, { anno, mese, fatturato: 0, margine: 0 })
    return m.get(k)!
  }
  for (const s of db.storico) {
    const x = get(s.anno, s.mese)
    x.fatturato += s.fatturato
    x.margine += s.margine ?? 0
  }
  for (const p of db.pratiche) {
    if (!venduta(p) || p.creata <= db.storicoFino) continue
    const d = parse(p.creata)
    const x = get(d.getFullYear(), d.getMonth() + 1)
    x.fatturato += totRicavo(p)
    x.margine += margine(p)
  }
  return [...m.values()].sort((a, b) => a.anno - b.anno || a.mese - b.mese)
}

export interface RigaAnno {
  anno: number
  fatturato: number
  margine: number
  /** variazione rispetto all'anno prima, a parità di mesi completi */
  crescita: number | null
  mesi: number
}

const MESE_CORRENTE = TODAY.getMonth() + 1
export const ANNO_CORRENTE = TODAY.getFullYear()

/** Variazione percentuale, null se manca il termine di confronto */
export const variazione = (nuovo: number, vecchio: number) => (vecchio > 0 ? ((nuovo - vecchio) / vecchio) * 100 : null)

export function perAnno(punti: PuntoMese[]): RigaAnno[] {
  const anni = [...new Set(punti.map((p) => p.anno))].sort()
  return anni.map((anno) => {
    const mio = punti.filter((p) => p.anno === anno)
    const fatturato = mio.reduce((s, p) => s + p.fatturato, 0)
    const margineTot = mio.reduce((s, p) => s + p.margine, 0)
    // confronto onesto: per l'anno in corso si usano i mesi già chiusi, e gli stessi mesi dell'anno prima
    const ultimo = anno === ANNO_CORRENTE ? MESE_CORRENTE - 1 : 12
    const ora = mio.filter((p) => p.mese <= ultimo).reduce((s, p) => s + p.fatturato, 0)
    const prima = punti.filter((p) => p.anno === anno - 1 && p.mese <= ultimo).reduce((s, p) => s + p.fatturato, 0)
    return { anno, fatturato, margine: margineTot, crescita: variazione(ora, prima), mesi: mio.length }
  })
}

export const mesiChiusiCorrente = () => MESE_CORRENTE - 1

// ——— Carte di credito ———

export function circuitoDa(numero: string): Circuito {
  const n = numero.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'American Express'
  return 'Altra'
}

export const soloCifre = (s: string) => s.replace(/\D/g, '')
export const ultime4 = (c: Carta) => soloCifre(c.numero).slice(-4)
export const mascherata = (c: Carta) => `•••• ${ultime4(c)}`

export function formattaNumero(numero: string) {
  const n = soloCifre(numero)
  if (/^3[47]/.test(n)) return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ')
  return n.replace(/(.{4})/g, '$1 ').trim()
}

/** Controllo di Luhn: avvisa di un numero digitato male (non blocca) */
export function luhnOk(numero: string) {
  const n = soloCifre(numero)
  if (n.length < 12) return false
  let somma = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    somma += d
  }
  return somma % 10 === 0
}

/** Scadenza "MM/AA": ultimo giorno del mese */
export function fineScadenza(s: string): Date | null {
  const m = /^(\d{1,2})\s*\/\s*(\d{2,4})$/.exec(s.trim())
  if (!m) return null
  const mese = Number(m[1])
  const anno = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2])
  if (mese < 1 || mese > 12) return null
  return new Date(anno, mese, 0, 12)
}
export function statoScadenza(c: Carta): 'ok' | 'in_scadenza' | 'scaduta' | 'sconosciuta' {
  const f = fineScadenza(c.scadenza)
  if (!f) return 'sconosciuta'
  const giorni = Math.round((f.getTime() - TODAY.getTime()) / 86_400_000)
  return giorni < 0 ? 'scaduta' : giorni <= 60 ? 'in_scadenza' : 'ok'
}

/** Prossima data in cui il saldo della carta viene addebitato in conto, e inizio del ciclo corrente */
export function cicloCarta(giorno: number) {
  const g = Math.min(Math.max(giorno, 1), 28)
  const prossimo = new Date(TODAY.getFullYear(), TODAY.getMonth(), g, 12)
  if (prossimo <= TODAY) prossimo.setMonth(prossimo.getMonth() + 1)
  const inizio = new Date(prossimo)
  inizio.setMonth(inizio.getMonth() - 1)
  return { prossimo: iso(prossimo), inizio: iso(inizio) }
}

export interface RigaCarta {
  carta: Carta
  addebitato: number
  scoperto: number
  prossimo: string
  limiteResiduo: number | null
}

/**
 * Scoperto = costi anticipati con le carte dell'agenzia, meno quanto il cliente ha già pagato su quella pratica.
 * Se in una pratica si usano più carte, lo scoperto si divide in proporzione a quanto ha anticipato ciascuna.
 */
export function scopertoCarte(db: DB) {
  const agenzia = db.carte.filter((c) => c.proprietario === 'agenzia')
  const perCarta = new Map<string, { addebitato: number; scoperto: number }>(agenzia.map((c) => [c.id, { addebitato: 0, scoperto: 0 }]))
  const perPratica: { pratica: Pratica; anticipato: number; incassato: number; scoperto: number }[] = []

  for (const p of db.pratiche) {
    if (p.stato === 'annullata') continue
    const anticipi = p.servizi.filter((s) => s.pagatoFornitore && s.cartaId && perCarta.has(s.cartaId))
    const tot = anticipi.reduce((s, x) => s + x.costo, 0)
    if (!tot) continue
    const inc = p.pagamenti.filter((x) => x.incassatoIl).reduce((s, x) => s + x.importo, 0)
    const scop = Math.max(0, tot - inc)
    perPratica.push({ pratica: p, anticipato: tot, incassato: inc, scoperto: scop })
    for (const s of anticipi) perCarta.get(s.cartaId!)!.scoperto += scop * (s.costo / tot)
  }

  const righe: RigaCarta[] = agenzia.map((carta) => {
    const ciclo = cicloCarta(carta.giornoAddebito ?? 15)
    const addebitato = db.pratiche
      .flatMap((p) => p.servizi)
      .filter((s) => s.cartaId === carta.id && s.pagatoIl && s.pagatoIl > ciclo.inizio)
      .reduce((s, x) => s + x.costo, 0)
    return { carta, addebitato, scoperto: perCarta.get(carta.id)!.scoperto, prossimo: ciclo.prossimo, limiteResiduo: carta.limite ? carta.limite - addebitato : null }
  })
  return { righe, totale: righe.reduce((s, r) => s + r.scoperto, 0), perPratica }
}

// ——— Importazione dello storico (CSV dal vecchio gestionale) ———

const NOMI_MESE = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export function numeroIt(s: string): number {
  const t = s.replace(/[€\s]/g, '')
  if (!t) return NaN
  if (t.includes(',') && t.includes('.')) return Number(t.replace(/\./g, '').replace(',', '.'))
  if (t.includes(',')) return Number(t.replace(',', '.'))
  return Number(t)
}

/** Righe "anno;mese;fatturato;margine" (separatore ; , o tab; intestazione facoltativa; margine facoltativo) */
export function parseStorico(testo: string) {
  const righe: { anno: number; mese: number; fatturato: number; margine?: number }[] = []
  const errori: string[] = []
  testo.split(/\r?\n/).forEach((riga, i) => {
    const r = riga.trim()
    if (!r) return
    const c = r.split(/[;\t]|,(?=\s*\d{4}\b)/).map((x) => x.trim())
    const parti = c.length >= 3 ? c : r.split(',').map((x) => x.trim())
    const anno = Number(parti[0])
    if (i === 0 && !Number.isFinite(anno)) return // intestazione
    const m = parti[1]?.toLowerCase() ?? ''
    const mese = /^\d+$/.test(m) ? Number(m) : NOMI_MESE.indexOf(m.slice(0, 3)) + 1
    const fatturato = numeroIt(parti[2] ?? '')
    const margine = parti[3] ? numeroIt(parti[3]) : undefined
    if (!(anno >= 1990 && anno <= 2100) || !(mese >= 1 && mese <= 12) || !Number.isFinite(fatturato)) {
      errori.push(`Riga ${i + 1}: “${r.slice(0, 40)}” non valida`)
      return
    }
    righe.push({ anno, mese, fatturato, margine: margine !== undefined && Number.isFinite(margine) ? margine : undefined })
  })
  return { righe, errori }
}
