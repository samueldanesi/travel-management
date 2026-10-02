import type { CategoriaBusiness, Cliente, DB, DestinatariSegmento, Pratica, Segmento } from '../data/types'

export const SEGMENTO_LABEL: Record<Segmento, string> = { vacanze: 'Viaggi vacanze', business: 'Viaggi professionisti' }
export const SEGMENTO_BREVE: Record<Segmento, string> = { vacanze: 'Vacanze', business: 'Professionisti' }
export const CATEGORIA_LABEL: Record<CategoriaBusiness, string> = {
  manager: 'Manager',
  imprenditore: 'Imprenditore',
  sportivo: 'Sportivo professionista',
  azienda: 'Azienda',
}
export const INTERESSI = ['mare', 'crociere', 'montagna', 'città d’arte', 'luna di miele', 'famiglia', 'esotico', 'benessere']

export const segmentoPratica = (db: DB, p: Pratica): Segmento => db.clienti.find((c) => c.id === p.clienteId)?.segmento ?? 'vacanze'

export const DESTINATARI_LABEL: Record<DestinatariSegmento, string> = { vacanze: 'Clienti vacanze', business: 'Professionisti', tutti: 'Tutti i clienti' }

/** Chi riceverà davvero una campagna: segmento giusto, interesse giusto, consenso e indirizzo email. */
export function destinatari(clienti: Cliente[], segmento: DestinatariSegmento, interesse?: string) {
  const inSegmento = clienti.filter((c) => (segmento === 'tutti' || c.segmento === segmento) && (!interesse || c.interessi.includes(interesse)))
  const ok = inSegmento.filter((c) => c.marketing && c.email)
  return { ok, esclusi: inSegmento.length - ok.length }
}
