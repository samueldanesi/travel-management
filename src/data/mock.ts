import { dayOffset } from '../lib/format'
import type { Automazione, Campagna, Carta, Cliente, DB, Fornitore, Operatore, Passeggero, Pagamento, Pratica, Regime, Servizio, StatoPratica, Rinnovo, StatoServizio, StoricoMese, TipoServizio } from './types'

let n = 0
const id = (p: string) => `${p}${++n}`

const operatori: Operatore[] = [
  { id: 'o1', nome: 'Giulia Castruccio', ruolo: 'Titolare', colore: '#0e7a86' },
  { id: 'o2', nome: 'Marco Bellandi', ruolo: 'Consulente viaggi', colore: '#b7791f' },
  { id: 'o3', nome: 'Elena Pieri', ruolo: 'Biglietteria e crociere', colore: '#7a4fb0' },
  { id: 'o4', nome: 'Paolo Nardi', ruolo: 'Amministrazione', colore: '#2f6690' },
]

const INT = { mare: 'mare', crociere: 'crociere', montagna: 'montagna', arte: 'città d’arte', luna: 'luna di miele', famiglia: 'famiglia', esotico: 'esotico', benessere: 'benessere' }

const clienti: Cliente[] = [
  // ——— Viaggi vacanze ———
  { id: 'c1', nome: 'Famiglia Rossi', segmento: 'vacanze', saluto: 'famiglia Rossi', email: 'luca.rossi@example.com', tel: '+39 333 1200451', citta: 'Lucca', interessi: [INT.mare, INT.famiglia], marketing: true, note: 'Viaggia ogni estate ad agosto. Preferisce villaggi con animazione bimbi.' },
  { id: 'c2', nome: 'Chiara Benedetti', segmento: 'vacanze', saluto: 'Chiara', email: 'c.benedetti@example.com', tel: '+39 347 5521983', citta: 'Pisa', interessi: [INT.arte, INT.esotico], marketing: true },
  { id: 'c3', nome: 'Andrea Lazzeri e Sofia Fanucchi', segmento: 'vacanze', saluto: 'Andrea e Sofia', email: 'andrea.lazzeri@example.com', tel: '+39 340 7712064', citta: 'Viareggio', interessi: [INT.luna, INT.esotico, INT.mare], marketing: true, note: 'Luna di miele, matrimonio a settembre.' },
  { id: 'c5', nome: 'Roberto e Maria Giusti', segmento: 'vacanze', saluto: 'Roberto e Maria', email: '', tel: '+39 339 6620118', citta: 'Capannori', interessi: [INT.crociere], marketing: false, note: 'Over 65, amano le crociere. Non usano email: chiamare.' },
  { id: 'c6', nome: 'Francesca Orsini', segmento: 'vacanze', saluto: 'Francesca', email: 'f.orsini@example.com', tel: '+39 392 0085512', citta: 'Massarosa', interessi: [INT.arte], marketing: true },
  { id: 'c7', nome: 'Gruppo CRAL Ospedale', segmento: 'vacanze', saluto: 'amici del CRAL', email: 'cral@ospedale.example', tel: '+39 0583 998811', citta: 'Lucca', interessi: [INT.arte, INT.mare], marketing: true, note: 'Gita sociale di gruppo, circa 30 persone.' },
  { id: 'c8', nome: 'Tommaso Pellegrini', segmento: 'vacanze', saluto: 'Tommaso e Marta', email: 'tommaso.p@example.com', tel: '+39 348 3310927', citta: 'Camaiore', interessi: [INT.crociere, INT.esotico], marketing: true },
  { id: 'c9', nome: 'Famiglia Bertolucci', segmento: 'vacanze', saluto: 'famiglia Bertolucci', email: 'bertolucci.fam@example.com', tel: '+39 335 9014477', citta: 'Altopascio', interessi: [INT.mare, INT.famiglia], marketing: false, note: 'Ha chiesto di non ricevere più comunicazioni promozionali.' },
  { id: 'c10', nome: 'Silvia Marchetti', segmento: 'vacanze', saluto: 'Silvia e Carlo', email: 'silvia.marchetti@example.com', tel: '+39 346 2208835', citta: 'Pietrasanta', interessi: [INT.mare, INT.arte], marketing: true },
  { id: 'c11', nome: 'Giorgia Ricci', segmento: 'vacanze', saluto: 'Giorgia', email: 'giorgia.ricci@example.com', tel: '+39 349 1187703', citta: 'Lucca', interessi: [INT.benessere, INT.montagna], marketing: true },
  { id: 'c12', nome: 'Famiglia Santini', segmento: 'vacanze', saluto: 'famiglia Santini', email: 'santini.fam@example.com', tel: '+39 338 4402196', citta: 'Porcari', interessi: [INT.montagna, INT.famiglia], marketing: true },
  { id: 'c13', nome: 'Lorenzo Papini', segmento: 'vacanze', saluto: 'Lorenzo', email: 'lorenzo.papini@example.com', tel: '+39 345 6639012', citta: 'Pisa', interessi: [INT.esotico, INT.mare], marketing: true },
  // ——— Viaggi per professionisti ———
  { id: 'c4', nome: 'Studio Tecnico Martinelli', segmento: 'business', saluto: 'Studio Martinelli', email: 'amministrazione@martinelli-studio.example', tel: '+39 0583 440120', citta: 'Lucca', interessi: [], categoria: 'azienda', ruolo: 'Studio di ingegneria, 6 persone', referente: 'Amministrazione', marketing: false, note: 'Trasferte di lavoro e un viaggio premio annuale per i dipendenti.' },
  { id: 'c14', nome: 'Davide Ferretti', segmento: 'business', saluto: 'dott. Ferretti', email: 'segreteria.ferretti@example.com', tel: '+39 335 7701234', citta: 'Milano', interessi: [], categoria: 'manager', ruolo: 'Direttore commerciale', organizzazione: 'Gruppo Elettra', referente: 'Sara, assistente', marketing: false, note: 'Business class, tariffe flessibili, hotel 5 stelle vicino alle sedi. Mai voli prima delle 8.' },
  { id: 'c15', nome: 'Marco Valenti', segmento: 'business', saluto: 'Marco', email: 'agente.valenti@example.com', tel: '+39 340 5509871', citta: 'Firenze', interessi: [], categoria: 'sportivo', ruolo: 'Tennista professionista', organizzazione: 'Staff di 3 persone', referente: 'Luca Fabbri, agente', marketing: false, note: 'Massima riservatezza: nessuna comunicazione sui social. Prenota tramite l’agente, che riceve anche le email.' },
  { id: 'c16', nome: 'Elisabetta Conti', segmento: 'business', saluto: 'dott.ssa Conti', email: 'e.conti@contimoda.example', tel: '+39 347 8820045', citta: 'Prato', interessi: [], categoria: 'imprenditore', ruolo: 'Amministratore delegato', organizzazione: 'Conti Moda srl', referente: 'Ufficio di presidenza', marketing: false, note: 'Fiere internazionali del settore moda, due o tre all’anno.' },
  { id: 'c17', nome: 'Nordlab Engineering', segmento: 'business', saluto: 'Nordlab', email: 'viaggi@nordlab.example', tel: '+39 0583 220077', citta: 'Lucca', interessi: [], categoria: 'azienda', ruolo: 'Società di ingegneria, trasferte frequenti', referente: 'Ufficio personale', marketing: false },
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
  o: { regime?: Regime; stato?: StatoServizio; emissione?: number; fornitore?: number; pagato?: boolean; carta?: string; pagatoIl?: number; pax?: string[]; pagante?: string } = {}
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
  pagatoFornitore: o.pagato ?? !!o.carta,
  pagatoIl: o.pagatoIl !== undefined ? dayOffset(o.pagatoIl) : undefined,
  cartaId: o.carta,
  passeggeriIds: o.pax,
  paganteId: o.pagante,
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
  o: { extraUE?: boolean; validita?: number; note?: string; pagante?: string } = {}
): Pratica => ({
  id: id('pr'),
  codice: `2026/${String(140 + ++seq * 3).padStart(4, '0')}`,
  clienteId, operatoreId, titolo, destinazione, stato,
  extraUE: o.extraUE ?? false,
  partenza: dayOffset(partenza),
  rientro: dayOffset(partenza + notti),
  creata: dayOffset(creata),
  validitaPreventivo: o.validita !== undefined ? dayOffset(o.validita) : undefined,
  paganteId: o.pagante,
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
        srv('volo', 'Voli ITA Roma–Malé a/r', 'f5', 1190, 1260, { stato: 'emesso', carta: 'k1', pagatoIl: -58 }),
        srv('transfer', 'Idrovolante e trasferimenti', 'f2', 420, 560, { fornitore: 20 }),
        srv('assicurazione', 'Annullamento + sanitaria', 'f6', 160, 225, { stato: 'emesso', pagato: true }),
      ],
      [pag('Acconto 30%', 2100, -55, -55), pag('Secondo acconto', 2300, -8, -6), pag('Saldo', 2935, 18)],
      { extraUE: true, note: 'Chiedere camera con vista, festeggiano anniversario di fidanzamento.' }),

    pratica('c1', 'o2', 'Sardegna — villaggio Cala Gonone', 'Sardegna', 'confermata', 22, 7, -95,
      [pax('Luca', 'Rossi', 42, 'carta_identita', 900), pax('Anna', 'Rossi', 40, 'carta_identita', 700), pax('Matteo', 'Rossi', 9, 'carta_identita', 500), pax('Giulia', 'Rossi', 6, 'carta_identita', 400)],
      [
        srv('pacchetto', 'Villaggio 7 notti, pensione completa, 2 adulti + 2 bambini', 'f1', 3980, 4580, { fornitore: 10 }),
        srv('transfer', 'Traghetto Livorno–Olbia auto + 4 pax', 'f1', 460, 540, { regime: 'intermediazione', stato: 'emesso', carta: 'k1', pagatoIl: -85 }),
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
        srv('volo', 'Voli Pisa–Lisbona a/r x6', 'f5', 1560, 1650, { stato: 'emesso', carta: 'k2', pagatoIl: -65 }),
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
        srv('pacchetto', 'Resort all inclusive 7 notti, volo incluso', 'f2', 2790, 3240, { carta: 'k1', pagatoIl: -6 }),
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

    // ——— Professionisti ———
    pratica('c14', 'o1', 'Trasferta Singapore — business class', 'Singapore', 'confermata', 19, 5, -1,
      [pax('Davide', 'Ferretti', 49, 'passaporto', 1900)],
      [
        srv('volo', 'ITA Airways Milano–Singapore, business, tariffa flessibile', 'f5', 3900, 4350, { stato: 'emesso', carta: 'k3', pagatoIl: -1 }),
        srv('hotel', 'Hotel 5 stelle Marina Bay, 5 notti, colazione', 'f8', 1640, 1900, { fornitore: 12 }),
        srv('transfer', 'Autista privato in aeroporto, andata e ritorno', 'f7', 220, 320, { regime: 'intermediazione' }),
      ],
      [pag('Saldo', 6570, 5)],
      { extraUE: true, note: 'Fattura intestata a Gruppo Elettra. Inviare itinerario all’assistente Sara.' }),

    (() => {
      const team = [
        pax('Marco', 'Valenti', 27, 'passaporto', 1500), pax('Paolo', 'Dini', 41, 'passaporto', 900), pax('Elena', 'Costa', 34, 'passaporto', 1300),
        pax('Luca', 'Fabbri', 45, 'passaporto', 1100), pax('Tommaso', 'Gori', 24, 'passaporto', 1400), pax('Andrea', 'Neri', 23, 'passaporto', 1250),
        pax('Silvia', 'Valenti', 52, 'passaporto', 800), pax('Carlo', 'Valenti', 55, 'passaporto', 800),
      ]
      const staff = team.slice(0, 4).map((x) => x.id)
      const resto = team.slice(4).map((x) => x.id)
      return pratica('c15', 'o1', 'Torneo a Melbourne — atleta, staff e famiglia', 'Australia', 'preventivo', 95, 16, -4, team,
        [
          srv('volo', 'Voli business Milano–Melbourne: atleta e staff (4)', 'f5', 12800, 14000, { stato: 'opzione', emissione: 3, pax: staff }),
          srv('volo', 'Voli economy Milano–Melbourne: sparring e famiglia (4)', 'f5', 4480, 4900, { stato: 'opzione', emissione: 3, pax: resto }),
          srv('hotel', 'Hotel 5 stelle vicino al centro tennis, 5 camere, 16 notti', 'f8', 17800, 20200, { stato: 'opzione', emissione: 3 }),
        ],
        [],
        { extraUE: true, validita: 5, pagante: team[0].id, note: 'Prenota e paga Marco per tutte e 8 le persone. Riservatezza massima: confermare solo con l’agente.' })
    })(),

    pratica('c17', 'o4', 'Roadshow clienti — Londra', 'Regno Unito', 'confermata', 12, 3, -20,
      [pax('Giulio', 'Neri', 45, 'passaporto', 1300), pax('Ilaria', 'Fiore', 38, 'passaporto', 1100), pax('Matteo', 'Luti', 33, 'carta_identita', 900), pax('Anna', 'Serra', 41, 'passaporto', 1700)],
      [
        srv('volo', 'Voli Pisa–Londra Heathrow a/r x4', 'f5', 1180, 1290, { stato: 'emesso', carta: 'k2', pagatoIl: -2 }),
        srv('hotel', 'Hotel 4 stelle Paddington, 4 camere, 3 notti', 'f8', 1560, 1830, { carta: 'k2', pagatoIl: -2 }),
      ],
      [pag('Acconto', 1600, -5, -4), pag('Saldo', 1520, 7)],
      { extraUE: true }),

    pratica('c16', 'o1', 'Fiera moda — Dubai', 'Emirati Arabi', 'conclusa', -70, 4, -110,
      [pax('Elisabetta', 'Conti', 52, 'passaporto', 1200), pax('Giorgio', 'Marini', 47, 'passaporto', 1100)],
      [
        srv('volo', 'Voli business Milano–Dubai x2', 'f5', 2600, 2900, { stato: 'emesso', pagato: true }),
        srv('hotel', 'Hotel 5 stelle vicino al quartiere fieristico, 4 notti', 'f8', 1100, 1350, { pagato: true }),
      ],
      [pag('Saldo', 4250, -85, -85, 'bonifico')],
      { extraUE: true }),
  ]

  const carte: Carta[] = [
    { id: 'k1', proprietario: 'agenzia', intestatario: 'Castruccio Viaggi srl', circuito: 'Visa', numero: '4111111111111111', scadenza: '09/28', cvv: '123', limite: 20000, giornoAddebito: 15, note: 'Carta business principale' },
    { id: 'k2', proprietario: 'agenzia', intestatario: 'Castruccio Viaggi srl', circuito: 'Mastercard', numero: '5555555555554444', scadenza: '02/28', cvv: '456', limite: 12000, giornoAddebito: 28, note: 'Carta per biglietteria aerea' },
    { id: 'k3', proprietario: 'c14', intestatario: 'Davide Ferretti', circuito: 'American Express', numero: '378282246310005', scadenza: '08/28', cvv: '1234', note: 'Carta aziendale Gruppo Elettra: usare per voli e hotel' },
    { id: 'k4', proprietario: 'c16', intestatario: 'Elisabetta Conti', circuito: 'Visa', numero: '4012888888881881', scadenza: '11/27', cvv: '789' },
    { id: 'k5', proprietario: 'c15', intestatario: 'Marco Valenti', circuito: 'Mastercard', numero: '5105105105105100', scadenza: '03/27', cvv: '321', limite: 50000, note: 'Paga lui per tutto lo staff e la famiglia' },
    { id: 'k6', proprietario: 'c4', intestatario: 'Studio Tecnico Martinelli', circuito: 'Visa', numero: '4222222222222', scadenza: '05/26', cvv: '654', note: 'Carta dello studio, da farsi aggiornare' },
  ]

  // Storico "migrato dal vecchio gestionale": dati fittizi con stagionalità, fino a settembre 2026
  const pesi = [0.11, 0.1, 0.1, 0.08, 0.07, 0.07, 0.07, 0.06, 0.07, 0.08, 0.09, 0.1]
  const annuale: Record<number, number> = { 2022: 612000, 2023: 688000, 2024: 751000, 2025: 826000, 2026: 902000 }
  const storico: StoricoMese[] = []
  for (const anno of [2022, 2023, 2024, 2025, 2026]) {
    for (let mese = 1; mese <= 12; mese++) {
      if (anno === 2026 && mese > 9) break
      const rumore = 1 + Math.sin(anno * 12 + mese * 1.7) * 0.07
      const fatturato = Math.round((annuale[anno] * pesi[mese - 1] * rumore) / 100) * 100
      storico.push({ anno, mese, fatturato, margine: Math.round((fatturato * (0.118 + Math.cos(anno + mese) * 0.01)) / 10) * 10 })
    }
  }
  const storicoFino = '2026-09-30'
  const rinnovi: Rinnovo[] = [
    { id: id('rn'), titolo: 'Polizza assicurativa responsabilità civile dell’agenzia', scadenza: dayOffset(118), note: 'Obbligatoria per le agenzie di viaggio. Compagnia e numero di polizza: da inserire.' },
    { id: id('rn'), titolo: 'Garanzia per insolvenza o fallimento (pacchetti venduti come organizzatore)', scadenza: dayOffset(205), note: 'Polizza o fideiussione bancaria.' },
    { id: id('rn'), titolo: 'Firma digitale della titolare', scadenza: dayOffset(41) },
    { id: id('rn'), titolo: 'Formazione sicurezza sul lavoro dei dipendenti', scadenza: dayOffset(88), note: 'Verificare con il consulente del lavoro o il RSPP.' },
    { id: id('rn'), titolo: 'Abilitazione del direttore tecnico', note: 'Nessuna scadenza, ma va comunicata ogni variazione.' },
  ]

  const campagne: Campagna[] = [
    { id: id('cm'), nome: 'Auguri di Natale 2025', template: 'natale', oggetto: 'Buone feste da Castruccio Viaggi', testo: '', stato: 'inviata', data: dayOffset(-282), inviati: 10, aperture: 7, click: 1 },
    { id: id('cm'), nome: 'Early booking estate 2026', template: 'early', oggetto: 'Prenota ora l’estate: sconti fino al 15%', testo: '', stato: 'inviata', data: dayOffset(-210), inviati: 9, aperture: 6, click: 3 },
    { id: id('cm'), nome: 'Settimana bianca e Dolomiti', template: 'libero', oggetto: 'Le Dolomiti vi aspettano', testo: '', interesse: INT.montagna, stato: 'inviata', data: dayOffset(-12), inviati: 2, aperture: 2, click: 1 },
    { id: id('cm'), nome: 'Offerte Natale e Capodanno', template: 'natale', oggetto: '', testo: '', stato: 'programmata', data: dayOffset(55) },
    { id: id('cm'), nome: 'Black Friday viaggi', template: 'blackfriday', oggetto: '', testo: '', stato: 'bozza' },
  ]
  const automazioni: Automazione[] = [
    { id: id('au'), nome: 'Promemoria di partenza', descrizione: 'Email con orari, documenti da portare e contatto d’emergenza.', quando: '7 giorni prima della partenza', attiva: true, inviati30: 9 },
    { id: id('au'), nome: 'Come è andato il viaggio?', descrizione: 'Ringrazia il cliente e chiede una recensione.', quando: '3 giorni dopo il rientro', attiva: true, inviati30: 6 },
    { id: id('au'), nome: 'Auguri di compleanno', descrizione: 'Un biglietto di auguri con un piccolo omaggio sul prossimo viaggio.', quando: 'Il giorno del compleanno', attiva: false, inviati30: 0 },
    { id: id('au'), nome: 'Ci siamo persi di vista?', descrizione: 'Proposta personalizzata a chi non viaggia con noi da 12 mesi.', quando: '12 mesi dall’ultimo viaggio', attiva: false, inviati30: 0 },
  ]
  return { operatori, clienti, fornitori, pratiche, campagne, automazioni, carte, storico, storicoFino, obblighiFatti: [], rinnovi }
}
