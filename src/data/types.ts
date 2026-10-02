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
  /** consenso a ricevere email promozionali (GDPR); solo clienti vacanze */
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
  /** quando e con cosa è stato pagato il fornitore */
  pagatoIl?: string
  cartaId?: string
  /** passeggeri coperti da questo servizio (vuoto = tutti quelli della pratica) */
  passeggeriIds?: string[]
  /** chi prenota e paga questo servizio, se diverso da chi paga la pratica (id passeggero) */
  paganteId?: string
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
  /** chi prenota e paga per tutti, se non è il cliente della pratica (id passeggero): tipico di sportivi e staff */
  paganteId?: string
  passeggeri: Passeggero[]
  servizi: Servizio[]
  pagamenti: Pagamento[]
  note?: string
}

export type TemplateId = 'natale' | 'capodanno' | 'blackfriday' | 'early' | 'ponti' | 'lastminute' | 'libero'
export type StatoCampagna = 'bozza' | 'programmata' | 'inviata'

export interface Campagna {
  id: string
  nome: string
  template: TemplateId
  oggetto: string
  testo: string
  /** filtro opzionale sugli interessi: le campagne vanno sempre e solo ai clienti vacanze */
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
  attiva: boolean
  inviati30: number
}

export type Circuito = 'Visa' | 'Mastercard' | 'American Express' | 'Altra'

export interface Carta {
  id: string
  /** 'agenzia' oppure l'id del cliente a cui appartiene */
  proprietario: string
  intestatario: string
  circuito: Circuito
  numero: string
  scadenza: string
  cvv?: string
  limite?: number
  /** solo carte dell'agenzia: giorno del mese in cui il saldo viene addebitato in conto */
  giornoAddebito?: number
  note?: string
}

/** Fatturato aggregato di un mese, importato dal vecchio gestionale */
export interface StoricoMese {
  anno: number
  mese: number
  fatturato: number
  margine?: number
}

export interface DB {
  operatori: Operatore[]
  clienti: Cliente[]
  fornitori: Fornitore[]
  pratiche: Pratica[]
  campagne: Campagna[]
  automazioni: Automazione[]
  carte: Carta[]
  storico: StoricoMese[]
  /** ultimo giorno coperto dallo storico importato: dopo questa data il fatturato si calcola dalle pratiche */
  storicoFino: string
}
