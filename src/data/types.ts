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

export interface Cliente {
  id: string
  nome: string
  tipo: 'privato' | 'azienda'
  email: string
  tel: string
  citta: string
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

export interface DB {
  operatori: Operatore[]
  clienti: Cliente[]
  fornitori: Fornitore[]
  pratiche: Pratica[]
}
