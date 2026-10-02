import type { CategoriaBusiness, Cliente, DB, Pratica, Segmento } from '../data/types'

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

/** Chi riceverà davvero una campagna: solo clienti vacanze, con l'interesse giusto, il consenso e un indirizzo email. */
export function destinatari(clienti: Cliente[], interesse?: string) {
  const vacanze = clienti.filter((c) => c.segmento === 'vacanze' && (!interesse || c.interessi.includes(interesse)))
  const ok = vacanze.filter((c) => c.marketing && c.email)
  return { ok, esclusi: vacanze.length - ok.length }
}
