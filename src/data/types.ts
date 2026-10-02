export type StatoPratica = 'preventivo' | 'confermata' | 'saldata' | 'in_viaggio' | 'conclusa' | 'annullata'
export type TipoServizio = 'volo' | 'hotel' | 'crociera' | 'pacchetto' | 'transfer' | 'assicurazione' | 'visto' | 'noleggio' | 'escursione'
export type StatoServizio = 'opzione' | 'confermato' | 'emesso'
/** 74ter = pacchetto turistico (IVA sul margine); intermediazione = l'agenzia incassa solo la commissione */
export type Regime = '74ter' | 'intermediazione'

export interface Operatore {
  id: string
  nome: string
  ruolo: string
  colore: string
}

export type Segmento = 'vacanze' | 'business'
export type CategoriaBusiness = 'manager' | 'imprenditore' | 'sportivo' | 'azienda'

export interface Cliente {
  id: string
  nome: string
  /** viaggi per vacanza oppure per professionisti (manager, sportivi, aziende) */
  segmento: Segmento
  /** come ci si rivolge al cliente nelle email: "famiglia Rossi", "dott. Ferretti" */
  saluto: string
  email: string
  tel: string
  citta: string
  /** solo vacanze: tipo di viaggi preferiti */
  interessi: string[]
  /** solo business */
  categoria?: CategoriaBusiness
  ruolo?: string
  organizzazione?: string
  /** assistente, agente o ufficio che gestisce le prenotazioni */
  referente?: string
  /** consenso a ricevere email promozionali (GDPR) */
  marketing: boolean
  note?: string
}

export interface Fornitore {
  id: string
  nome: string
  tipo: string
  commissione: number
  email: string
  tel: string
}

export interface Passeggero {
  id: string
  nome: string
  cognome: string
  nascita: string
  docTipo: 'passaporto' | 'carta_identita'
  docNumero: string
  docScadenza: string
}

export interface Servizio {
  id: string
  tipo: TipoServizio
  descrizione: string
  fornitoreId: string
  /** quanto paga l'agenzia al fornitore */
  costo: number
  /** quanto paga il cliente per questo servizio */
  ricavo: number
  regime: Regime
  stato: StatoServizio
  /** termine per emettere / confermare l'opzione */
  scadenzaEmissione?: string
  /** data entro cui pagare il fornitore */
  scadenzaFornitore?: string
  pagatoFornitore: boolean
}

export interface Pagamento {
  id: string
  etichetta: string
  importo: number
  scadenza: string
  incassatoIl?: string
  metodo?: 'contanti' | 'bonifico' | 'carta' | 'pos'
}

export interface Pratica {
  id: string
  codice: string
  clienteId: string
  operatoreId: string
  titolo: string
  destinazione: string
  /** destinazione fuori dall'Unione Europea: controlli passaporto più severi */
  extraUE: boolean
  stato: StatoPratica
  partenza: string
  rientro: string
  creata: string
  validitaPreventivo?: string
  passeggeri: Passeggero[]
  servizi: Servizio[]
  pagamenti: Pagamento[]
  note?: string
}

export type TemplateId = 'natale' | 'capodanno' | 'blackfriday' | 'early' | 'ponti' | 'lastminute' | 'business' | 'libero'
export type StatoCampagna = 'bozza' | 'programmata' | 'inviata'
export type DestinatariSegmento = Segmento | 'tutti'

export interface Campagna {
  id: string
  nome: string
  template: TemplateId
  oggetto: string
  testo: string
  segmento: DestinatariSegmento
  /** filtro opzionale sugli interessi (solo vacanze) */
  interesse?: string
  stato: StatoCampagna
  data?: string
  inviati?: number
  aperture?: number
  click?: number
}

export interface Automazione {
  id: string
  nome: string
  descrizione: string
  quando: string
  segmento: DestinatariSegmento
  attiva: boolean
  inviati30: number
}

export interface DB {
  operatori: Operatore[]
  clienti: Cliente[]
  fornitori: Fornitore[]
  pratiche: Pratica[]
  campagne: Campagna[]
  automazioni: Automazione[]
}
