import type { TemplateId } from '../data/types'

export interface Template {
  id: TemplateId
  label: string
  oggetto: string
  testo: string
}

const FIRMA = '\n\nUn caro saluto,\nGiulia e tutto il team di Castruccio Viaggi'

export const TEMPLATES: Template[] = [
  {
    id: 'natale', label: 'Natale e feste',
    oggetto: 'Buone feste da Castruccio Viaggi, e un’idea per iniziare bene l’anno',
    testo: 'Ciao {saluto},\n\nsi avvicina il Natale e vogliamo farvi i nostri auguri. Per le feste abbiamo preparato alcune proposte: mercatini di Natale, settimane bianche e partenze al caldo per il Capodanno.\n\nPassa in agenzia o rispondi a questa email: ti prepariamo un preventivo senza impegno.' + FIRMA,
  },
  {
    id: 'capodanno', label: 'Capodanno',
    oggetto: 'Dove passare il Capodanno? Ultime disponibilità',
    testo: 'Ciao {saluto},\n\nper Capodanno ci sono ancora posti su alcune partenze: capitali europee, crociere di fine anno e resort al caldo.\n\nSe vuoi partire, ora è il momento di decidere: le camere migliori finiscono per prime. Scrivici o chiamaci e ti proponiamo le soluzioni più adatte a voi.' + FIRMA,
  },
  {
    id: 'blackfriday', label: 'Black Friday viaggi',
    oggetto: 'Black Friday: offerte viaggio solo questa settimana',
    testo: 'Ciao {saluto},\n\nquesta settimana abbiamo selezionato alcune offerte a tempo su pacchetti e crociere per il prossimo anno.\n\nI posti sono limitati e le condizioni valgono solo fino a domenica. Rispondi a questa email o passa a trovarci per riservare il tuo.' + FIRMA,
  },
  {
    id: 'early', label: 'Prenota in anticipo',
    oggetto: 'Prenota ora la vacanza e risparmia: offerte anticipate',
    testo: 'Ciao {saluto},\n\nprenotando in anticipo i migliori villaggi, crociere e tour hanno prezzi più bassi e più scelta di camere e date.\n\nVuoi che ti prepariamo una proposta per la prossima estate? Dicci quando vorresti partire e con chi: al resto pensiamo noi.' + FIRMA,
  },
  {
    id: 'ponti', label: 'Ponti e weekend lunghi',
    oggetto: 'Ponti di primavera: idee per un weekend lungo',
    testo: 'Ciao {saluto},\n\nin primavera arrivano i ponti: ottime occasioni per una fuga in una capitale europea o al mare.\n\nLe sistemazioni migliori si riempiono presto. Scrivici e ti proponiamo qualche idea in base al tuo budget.' + FIRMA,
  },
  {
    id: 'lastminute', label: 'Last minute',
    oggetto: 'Ultimi posti: partenze nelle prossime due settimane',
    testo: 'Ciao {saluto},\n\nabbiamo alcune partenze last minute a prezzi molto interessanti: se hai la valigia pronta, questo è il momento.\n\nRispondi a questa email o chiamaci in agenzia per sapere cosa è ancora disponibile.' + FIRMA,
  },
  { id: 'libero', label: 'Testo libero', oggetto: '', testo: 'Ciao {saluto},\n\n' + FIRMA.trim() },
]

export const templateDi = (id: TemplateId) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1]

/** Periodi in cui i clienti delle agenzie di viaggio rispondono meglio. Date di invio suggerite. */
export const CALENDARIO: { titolo: string; invio: string; nota: string; template: TemplateId }[] = [
  { titolo: 'Black Friday viaggi', invio: '2026-11-20', nota: 'Offerte a tempo, ottimo per crociere e pacchetti dell’anno dopo.', template: 'blackfriday' },
  { titolo: 'Ponte dell’Immacolata e mercatini', invio: '2026-11-16', nota: 'Weekend lunghi nelle città dei mercatini di Natale.', template: 'ponti' },
  { titolo: 'Natale e Capodanno', invio: '2026-11-26', nota: 'Auguri più proposte per le feste. È il picco dell’anno.', template: 'natale' },
  { titolo: 'Ultime disponibilità Capodanno', invio: '2026-12-09', nota: 'Per chi non ha ancora deciso.', template: 'capodanno' },
  { titolo: 'Early booking estate 2027', invio: '2027-01-14', nota: 'Il momento migliore per vendere villaggi e crociere estivi.', template: 'early' },
  { titolo: 'Ponti di primavera', invio: '2027-03-18', nota: '25 aprile e 1° maggio: gli ultimi giorni utili per prenotare.', template: 'ponti' },
]
