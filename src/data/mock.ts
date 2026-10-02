import { dayOffset } from '../lib/format'
import type { Cliente, DB, Fornitore, Operatore, Passeggero, Pagamento, Pratica, Regime, Servizio, StatoPratica, StatoServizio, TipoServizio } from './types'

let n = 0
const id = (p: string) => `${p}${++n}`

const operatori: Operatore[] = [
  { id: 'o1', nome: 'Giulia Castruccio', ruolo: 'Titolare', colore: '#0e7a86' },
  { id: 'o2', nome: 'Marco Bellandi', ruolo: 'Consulente viaggi', colore: '#b7791f' },
  { id: 'o3', nome: 'Elena Pieri', ruolo: 'Biglietteria e crociere', colore: '#7a4fb0' },
  { id: 'o4', nome: 'Paolo Nardi', ruolo: 'Amministrazione', colore: '#2f6690' },
]

const clienti: Cliente[] = [
  { id: 'c1', nome: 'Famiglia Rossi', tipo: 'privato', email: 'luca.rossi@example.com', tel: '+39 333 1200451', citta: 'Lucca', note: 'Viaggia ogni estate ad agosto. Preferisce villaggi con animazione bimbi.' },
  { id: 'c2', nome: 'Chiara Benedetti', tipo: 'privato', email: 'c.benedetti@example.com', tel: '+39 347 5521983', citta: 'Pisa' },
  { id: 'c3', nome: 'Andrea Lazzeri e Sofia Fanucchi', tipo: 'privato', email: 'andrea.lazzeri@example.com', tel: '+39 340 7712064', citta: 'Viareggio', note: 'Luna di miele, matrimonio a settembre.' },
  { id: 'c4', nome: 'Studio Tecnico Martinelli', tipo: 'azienda', email: 'amministrazione@martinelli-studio.example', tel: '+39 0583 440120', citta: 'Lucca', note: 'Trasferte di lavoro e un viaggio premio annuale per i dipendenti.' },
  { id: 'c5', nome: 'Roberto e Maria Giusti', tipo: 'privato', email: 'giusti.rm@example.com', tel: '+39 339 6620118', citta: 'Capannori', note: 'Over 65, amano le crociere. Non usano email: chiamare.' },
  { id: 'c6', nome: 'Francesca Orsini', tipo: 'privato', email: 'f.orsini@example.com', tel: '+39 392 0085512', citta: 'Massarosa' },
  { id: 'c7', nome: 'Gruppo CRAL Ospedale', tipo: 'azienda', email: 'cral@ospedale.example', tel: '+39 0583 998811', citta: 'Lucca', note: 'Gita sociale di gruppo, circa 30 persone.' },
  { id: 'c8', nome: 'Tommaso Pellegrini', tipo: 'privato', email: 'tommaso.p@example.com', tel: '+39 348 3310927', citta: 'Camaiore' },
  { id: 'c9', nome: 'Famiglia Bertolucci', tipo: 'privato', email: 'bertolucci.fam@example.com', tel: '+39 335 9014477', citta: 'Altopascio' },
  { id: 'c10', nome: 'Silvia Marchetti', tipo: 'privato', email: 'silvia.marchetti@example.com', tel: '+39 346 2208835', citta: 'Pietrasanta' },
]

const fornitori: Fornitore[] = [
  { id: 'f1', nome: 'Alpitour World', tipo: 'Tour operator', commissione: 11, email: 'agenzie@alpitour.example', tel: '+39 011 000 0001' },
  { id: 'f2', nome: 'Veratour', tipo: 'Tour operator', commissione: 12, email: 'adv@veratour.example', tel: '+39 06 000 0002' },
  { id: 'f3', nome: 'Costa Crociere', tipo: 'Crociere', commissione: 10, email: 'agenzie@costa.example', tel: '+39 010 000 0003' },
  { id: 'f4', nome: 'MSC Crociere', tipo: 'Crociere', commissione: 10, email: 'adv@msc.example', tel: '+39 081 000 0004' },
  { id: 'f5', nome: 'ITA Airways', tipo: 'Compagnia aerea', commissione: 3, email: 'adv@ita.example', tel: '+39 06 000 0005' },
  { id: 'f6', nome: 'Europ Assistance', tipo: 'Assicurazione', commissione: 25, email: 'adv@europassistance.example', tel: '+39 02 000 0006' },
  { id: 'f7', nome: 'Transfer Toscana NCC', tipo: 'Transfer', commissione: 0, email: 'info@transfertoscana.example', tel: '+39 0583 000 0007' },
  { id: 'f8', nome: 'Hotel Belvedere (diretto)', tipo: 'Hotel', commissione: 10, email: 'booking@belvedere.example', tel: '+39 0584 000 0008' },
  { id: 'f9', nome: 'Futura Vacanze', tipo: 'Tour operator', commissione: 12, email: 'adv@futura.example', tel: '+39 02 000 0009' },
]

const pax = (nome: string, cognome: string, anni: number, doc: 'passaporto' | 'carta_identita', scade: number, num = ''): Passeggero => ({
  id: id('x'),
  nome,
  cognome,
  nascita: dayOffset(-Math.round(anni * 365.25)),
  docTipo: doc,
  docNumero: num || (doc === 'passaporto' ? `YB${Math.floor(1000000 + n * 7919)}` : `CA${Math.floor(10000 + n * 313)}AB`),
  docScadenza: dayOffset(scade),
})

const srv = (
  tipo: TipoServizio, descrizione: string, fornitoreId: string, costo: number, ricavo: number,
  o: { regime?: Regime; stato?: StatoServizio; emissione?: number; fornitore?: number; pagato?: boolean } = {}
): Servizio => ({
  id: id('s'),
  tipo,
  descrizione,
  fornitoreId,
  costo,
  ricavo,
  regime: o.regime ?? (tipo === 'volo' || tipo === 'assicurazione' || tipo === 'transfer' ? 'intermediazione' : '74ter'),
  stato: o.stato ?? 'confermato',
  scadenzaEmissione: o.emissione !== undefined ? dayOffset(o.emissione) : undefined,
  scadenzaFornitore: o.fornitore !== undefined ? dayOffset(o.fornitore) : undefined,
  pagatoFornitore: o.pagato ?? false,
})

const pag = (etichetta: string, importo: number, scadenza: number, pagato?: number, metodo: Pagamento['metodo'] = 'bonifico'): Pagamento => ({
  id: id('p'),
  etichetta,
  importo,
  scadenza: dayOffset(scadenza),
  incassatoIl: pagato !== undefined ? dayOffset(pagato) : undefined,
  metodo: pagato !== undefined ? metodo : undefined,
})

let seq = 0
const pratica = (
  clienteId: string, operatoreId: string, titolo: string, destinazione: string, stato: StatoPratica,
  partenza: number, notti: number, creata: number,
  passeggeri: Passeggero[], servizi: Servizio[], pagamenti: Pagamento[],
  o: { extraUE?: boolean; validita?: number; note?: string } = {}
): Pratica => ({
  id: id('pr'),
  codice: `2026/${String(140 + ++seq * 3).padStart(4, '0')}`,
  clienteId, operatoreId, titolo, destinazione, stato,
  extraUE: o.extraUE ?? false,
  partenza: dayOffset(partenza),
  rientro: dayOffset(partenza + notti),
  creata: dayOffset(creata),
  validitaPreventivo: o.validita !== undefined ? dayOffset(o.validita) : undefined,
  passeggeri, servizi, pagamenti,
  note: o.note,
})

export function buildInitialDB(): DB {
  n = 0
  seq = 0
  const pratiche: Pratica[] = [
    pratica('c3', 'o1', 'Maldive — luna di miele', 'Maldive', 'confermata', 48, 9, -60,
      [pax('Andrea', 'Lazzeri', 32, 'passaporto', 1500), pax('Sofia', 'Fanucchi', 30, 'passaporto', 1100)],
      [
        srv('pacchetto', 'Soggiorno 9 notti resort Vilamendhoo, mezza pensione', 'f2', 4480, 5290, { fornitore: 20 }),
        srv('volo', 'Voli ITA Roma–Malé a/r', 'f5', 1190, 1260, { stato: 'emesso', pagato: true }),
        srv('transfer', 'Idrovolante e trasferimenti', 'f2', 420, 560, { fornitore: 20 }),
        srv('assicurazione', 'Annullamento + sanitaria', 'f6', 160, 225, { stato: 'emesso', pagato: true }),
      ],
      [pag('Acconto 30%', 2100, -55, -55), pag('Secondo acconto', 2300, -8, -6), pag('Saldo', 2935, 18)],
      { extraUE: true, note: 'Chiedere camera con vista, festeggiano anniversario di fidanzamento.' }),

    pratica('c1', 'o2', 'Sardegna — villaggio Cala Gonone', 'Sardegna', 'confermata', 22, 7, -95,
      [pax('Luca', 'Rossi', 42, 'carta_identita', 900), pax('Anna', 'Rossi', 40, 'carta_identita', 700), pax('Matteo', 'Rossi', 9, 'carta_identita', 500), pax('Giulia', 'Rossi', 6, 'carta_identita', 400)],
      [
        srv('pacchetto', 'Villaggio 7 notti, pensione completa, 2 adulti + 2 bambini', 'f1', 3980, 4580, { fornitore: 10 }),
        srv('transfer', 'Traghetto Livorno–Olbia auto + 4 pax', 'f1', 460, 540, { regime: 'intermediazione', stato: 'emesso', pagato: true }),
      ],
      [pag('Acconto', 1500, -90, -90), pag('Secondo acconto', 1500, -30, -28), pag('Saldo', 2120, -3)],
      { note: 'Saldo scaduto: sollecitare.' }),

    pratica('c5', 'o3', 'Crociera Mediterraneo occidentale', 'Mediterraneo', 'confermata', 33, 7, -120,
      [pax('Roberto', 'Giusti', 68, 'carta_identita', 1200), pax('Maria', 'Giusti', 66, 'carta_identita', 80)],
      [
        srv('crociera', 'Costa Smeralda, cabina balcone, 7 notti', 'f3', 2290, 2780, { fornitore: 14 }),
        srv('assicurazione', 'Polizza crociera annullamento', 'f6', 90, 128, { stato: 'emesso', pagato: true }),
      ],
      [pag('Acconto 25%', 780, -110, -110), pag('Saldo', 2128, 14)],
      { note: 'La carta d\'identità di Maria scade 80 giorni dopo il rientro: va bene per la crociera UE, consigliare di rinnovarla.' }),

    pratica('c2', 'o2', 'Giappone — tour Tokyo e Kyoto', 'Giappone', 'confermata', 78, 12, -40,
      [pax('Chiara', 'Benedetti', 35, 'passaporto', 130, 'YA2201988'), pax('Elisa', 'Benedetti', 33, 'passaporto', 2400)],
      [
        srv('pacchetto', 'Tour di gruppo 12 giorni con guida in italiano', 'f9', 3680, 4290, { fornitore: 40 }),
        srv('volo', 'Voli Milano–Tokyo a/r', 'f5', 1840, 1980, { stato: 'opzione', emissione: 2 }),
        srv('assicurazione', 'Polizza viaggio estesa', 'f6', 120, 170, { stato: 'opzione' }),
      ],
      [pag('Acconto 25%', 1600, -38, -38, 'carta'), pag('Saldo', 4840, 40)],
      { extraUE: true, note: 'Il passaporto di Chiara scade a ridosso del rientro: va rinnovato prima della partenza.' }),

    pratica('c4', 'o1', 'Viaggio premio dipendenti — Lisbona', 'Portogallo', 'confermata', 56, 4, -75,
      Array.from({ length: 6 }, (_, i) => pax(['Davide', 'Laura', 'Stefano', 'Monica', 'Gianni', 'Paola'][i], 'Martinelli', 38 + i, 'carta_identita', 1400 + i * 40)),
      [
        srv('pacchetto', 'Hotel 4* centro, 4 notti, colazione, 3 camere', 'f8', 3180, 3720, { fornitore: 30 }),
        srv('volo', 'Voli Pisa–Lisbona a/r x6', 'f5', 1560, 1650, { stato: 'emesso', pagato: true }),
        srv('escursione', 'Tour Sintra e Cascais con guida privata', 'f7', 540, 720, { regime: '74ter', fornitore: 45 }),
      ],
      [pag('Acconto 40%', 2300, -70, -70), pag('Saldo', 3790, 25)]),

    pratica('c6', 'o3', 'Weekend a Parigi', 'Francia', 'saldata', 9, 3, -30,
      [pax('Francesca', 'Orsini', 29, 'carta_identita', 900), pax('Giorgio', 'Orsini', 31, 'carta_identita', 1100)],
      [
        srv('pacchetto', 'Hotel Marais 3 notti con colazione', 'f9', 640, 780, { pagato: true }),
        srv('volo', 'Voli Pisa–Parigi a/r', 'f5', 280, 310, { stato: 'emesso', pagato: true }),
      ],
      [pag('Saldo unico', 1090, -28, -28, 'pos')]),

    pratica('c9', 'o2', 'Egitto — Sharm el Sheikh', 'Egitto', 'confermata', 14, 7, -50,
      [pax('Paola', 'Bertolucci', 44, 'passaporto', 1000), pax('Franco', 'Bertolucci', 46, 'carta_identita', 700), pax('Irene', 'Bertolucci', 15, 'passaporto', 900)],
      [
        srv('pacchetto', 'Resort all inclusive 7 notti, volo incluso', 'f2', 2790, 3240, { fornitore: 3 }),
        srv('visto', 'Visto d\'ingresso x3', 'f2', 75, 105, { regime: 'intermediazione' }),
      ],
      [pag('Acconto', 1300, -48, -48), pag('Saldo', 2045, 7)],
      { extraUE: true }),

    pratica('c7', 'o1', 'Gita sociale CRAL — Costiera Amalfitana', 'Campania', 'preventivo', 85, 3, -6,
      Array.from({ length: 2 }, (_, i) => pax(['Referente', 'Referente 2'][i], 'CRAL', 50, 'carta_identita', 900)),
      [
        srv('pacchetto', 'Hotel Sorrento, 3 notti, 30 pax, bus GT incluso', 'f9', 9600, 11400, { stato: 'opzione', emissione: 6 }),
      ],
      [],
      { validita: 6, note: 'Preventivo per 30 persone. Attendere conferma del direttivo del CRAL.' }),

    pratica('c8', 'o3', 'Crociera Fiordi norvegesi', 'Norvegia', 'preventivo', 130, 8, -3,
      [pax('Tommaso', 'Pellegrini', 54, 'passaporto', 1700), pax('Marta', 'Pellegrini', 52, 'passaporto', 1700)],
      [
        srv('crociera', 'MSC Preziosa, cabina esterna, 8 notti', 'f4', 2480, 3050, { stato: 'opzione', emissione: 4 }),
        srv('volo', 'Voli per Copenaghen a/r', 'f5', 520, 570, { stato: 'opzione', emissione: 4 }),
      ],
      [],
      { validita: 4, extraUE: true }),

    pratica('c10', 'o2', 'Grecia — isole Cicladi', 'Grecia', 'preventivo', 95, 8, -2,
      [pax('Silvia', 'Marchetti', 38, 'carta_identita', 1000), pax('Carlo', 'Marchetti', 40, 'carta_identita', 1000)],
      [
        srv('pacchetto', 'Santorini e Naxos, 8 notti, hotel e traghetti', 'f9', 2150, 2690, { stato: 'opzione', emissione: 8 }),
        srv('volo', 'Voli Pisa–Atene a/r', 'f5', 460, 510, { stato: 'opzione', emissione: 8 }),
      ],
      [],
      { validita: 9 }),

    pratica('c1', 'o2', 'Weekend Dolomiti (Pasqua scorsa)', 'Trentino', 'conclusa', -140, 4, -190,
      [pax('Luca', 'Rossi', 42, 'carta_identita', 900), pax('Anna', 'Rossi', 40, 'carta_identita', 700)],
      [srv('pacchetto', 'Hotel benessere 4 notti', 'f8', 980, 1180, { pagato: true })],
      [pag('Saldo', 1180, -150, -150, 'carta')]),

    pratica('c5', 'o3', 'Crociera Caraibi (inverno)', 'Caraibi', 'conclusa', -260, 9, -330,
      [pax('Roberto', 'Giusti', 68, 'passaporto', 800), pax('Maria', 'Giusti', 66, 'passaporto', 800)],
      [srv('crociera', 'Costa, 9 notti', 'f3', 3400, 4050, { pagato: true }), srv('volo', 'Voli charter a/r', 'f5', 1100, 1190, { stato: 'emesso', pagato: true })],
      [pag('Saldo', 5240, -280, -280)],
      { extraUE: true }),

    pratica('c2', 'o4', 'Sicilia on the road', 'Sicilia', 'in_viaggio', -3, 8, -45,
      [pax('Chiara', 'Benedetti', 35, 'carta_identita', 800), pax('Elisa', 'Benedetti', 33, 'carta_identita', 700)],
      [
        srv('noleggio', 'Auto compatta 8 giorni', 'f7', 290, 380, { regime: 'intermediazione', stato: 'emesso', pagato: true }),
        srv('pacchetto', 'Hotel e B&B itinerante, 8 notti', 'f9', 1260, 1520, { pagato: true }),
      ],
      [pag('Acconto', 900, -40, -40), pag('Saldo', 1000, -10, -9)]),

    pratica('c9', 'o4', 'Mini crociera Barcellona', 'Spagna', 'annullata', 40, 4, -35,
      [pax('Paola', 'Bertolucci', 44, 'carta_identita', 700)],
      [srv('crociera', 'MSC, 4 notti', 'f4', 590, 720, { pagato: false })],
      [pag('Acconto', 200, -33, -33)],
      { note: 'Annullata dal cliente per motivi di salute. Verificare rimborso assicurativo.' }),
  ]
  return { operatori, clienti, fornitori, pratiche }
}
